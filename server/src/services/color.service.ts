import axios from 'axios';

/**
 * Color extraction service for spine display.
 * Uses sharp to extract dominant colors from poster images.
 * Gracefully degrades if sharp is not available (e.g., local dev without native deps).
 */

interface SpineColors {
  dominant: string;  // Hex color e.g. '#1a3c5e'
  accent: string;    // Hex color for text contrast e.g. '#e8d4a0'
}

// Dynamically load sharp - it may not be available in all environments
let sharpModule: any = null;
let sharpLoaded = false;

async function getSharp(): Promise<any> {
  if (sharpLoaded) return sharpModule;
  try {
    sharpModule = (await import('sharp')).default;
    sharpLoaded = true;
    return sharpModule;
  } catch {
    sharpLoaded = true;
    console.warn('Sharp not available - spine color extraction will use fallback colors');
    return null;
  }
}

/**
 * Generate a deterministic color from a string (used as fallback).
 */
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Generate a pleasant hue avoiding extremes
  const hue = Math.abs(hash % 360);
  const saturation = 40 + Math.abs((hash >> 8) % 30); // 40-70%
  const lightness = 25 + Math.abs((hash >> 16) % 20);  // 25-45% (dark enough for light text)
  return hslToHex(hue, saturation, lightness);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Calculate relative luminance of a hex color.
 */
function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Get a contrasting text color for a given background.
 */
function getContrastColor(bgHex: string): string {
  const luminance = getLuminance(bgHex);
  // Use white text on dark backgrounds, dark text on light backgrounds
  return luminance > 0.35 ? '#1a1a2e' : '#f0f0f0';
}

/**
 * Extract dominant and accent colors from an image URL.
 * Falls back to deterministic hash colors if sharp is unavailable or extraction fails.
 */
export async function extractSpineColors(imageUrl: string, itemName: string): Promise<SpineColors> {
  try {
    const sharp = await getSharp();
    if (!sharp) {
      return getFallbackColors(itemName);
    }

    // Fetch image as buffer
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });

    const imageBuffer = Buffer.from(response.data);

    // Resize to small sample for fast color analysis
    const { data, info } = await sharp(imageBuffer)
      .resize(16, 16, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Collect pixel colors
    const pixels: Array<[number, number, number]> = [];
    for (let i = 0; i < data.length; i += 3) {
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }

    // Filter out near-gray pixels (low saturation) and very dark/light pixels
    const colorfulPixels = pixels.filter(([r, g, b]) => {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      const brightness = (r + g + b) / 3;
      // Keep pixels with some color saturation and moderate brightness
      return diff > 20 && brightness > 30 && brightness < 230;
    });

    if (colorfulPixels.length === 0) {
      // All pixels are gray-ish, use the average
      const avg = pixels.reduce(
        (acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b],
        [0, 0, 0]
      ).map(v => Math.round(v / pixels.length));
      const dominant = `#${avg.map(v => v.toString(16).padStart(2, '0')).join('')}`;
      return { dominant, accent: getContrastColor(dominant) };
    }

    // Simple k-means-ish: find the most common color region
    // Group pixels into buckets by rounding to nearest 32
    const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
    for (const [r, g, b] of colorfulPixels) {
      const key = `${Math.round(r / 32)},${Math.round(g / 32)},${Math.round(b / 32)}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.count++;
        existing.r += r;
        existing.g += g;
        existing.b += b;
      } else {
        buckets.set(key, { count: 1, r, g, b });
      }
    }

    // Find the largest bucket
    let dominant = { count: 0, r: 0, g: 0, b: 0 };
    for (const bucket of buckets.values()) {
      if (bucket.count > dominant.count) {
        dominant = bucket;
      }
    }

    // Average the colors in the dominant bucket
    const avgR = Math.round(dominant.r / dominant.count);
    const avgG = Math.round(dominant.g / dominant.count);
    const avgB = Math.round(dominant.b / dominant.count);

    const dominantHex = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
    const accentHex = getContrastColor(dominantHex);

    return { dominant: dominantHex, accent: accentHex };
  } catch (error) {
    console.warn(`Failed to extract colors for "${itemName}":`, error instanceof Error ? error.message : error);
    return getFallbackColors(itemName);
  }
}

/**
 * Get fallback colors based on item name hash.
 */
export function getFallbackColors(itemName: string): SpineColors {
  const dominant = hashColor(itemName);
  const accent = getContrastColor(dominant);
  return { dominant, accent };
}
