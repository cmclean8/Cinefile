import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const DynamicFavicon: React.FC = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const updateFavicon = () => {
      console.log('DynamicFavicon: Updating favicon for theme:', resolvedTheme);
      
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll('link[rel*="icon"]');
      existingLinks.forEach(link => link.remove());

      // Add SVG favicon (works in modern browsers)
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/svg+xml';
      favicon.href = '/favicon.svg';
      document.head.appendChild(favicon);
      console.log('DynamicFavicon: Added SVG favicon');

      // Update manifest for PWA
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (manifestLink) {
        // Create a new manifest
        const manifest = {
          name: "Cinefile",
          short_name: "Cinefile",
          description: "Your Physical Media Collection Manager",
          start_url: "/",
          display: "standalone",
          background_color: resolvedTheme === 'dark' ? "#1a1a1a" : "#ffffff",
          theme_color: resolvedTheme === 'dark' ? "#1a3a3a" : "#2D5A5A",
          icons: [
            {
              src: "/favicon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any"
            }
          ]
        };

        // Create a blob URL for the manifest
        const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const manifestUrl = URL.createObjectURL(manifestBlob);
        manifestLink.href = manifestUrl;
        console.log('DynamicFavicon: Updated manifest for theme:', resolvedTheme);
      }
    };

    // Only update if theme is actually resolved (not the initial 'light' default)
    if (resolvedTheme) {
      updateFavicon();
    }
  }, [resolvedTheme]);

  return null; // This component doesn't render anything
};

export default DynamicFavicon;
