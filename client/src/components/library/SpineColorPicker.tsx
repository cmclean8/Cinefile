import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api.service';

interface SpineColorPickerProps {
  physicalItemId: number;
  onClose: () => void;
  onSave: () => void;
}

const SpineColorPicker: React.FC<SpineColorPickerProps> = ({
  physicalItemId,
  onClose,
  onSave,
}) => {
  const [dominantColor, setDominantColor] = useState('#3b5998');
  const [accentColor, setAccentColor] = useState('#f0f0f0');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [itemName, setItemName] = useState('');

  // Load current item colors
  useEffect(() => {
    const loadItem = async () => {
      try {
        const item = await apiService.getPhysicalItemById(physicalItemId);
        setItemName(item.name);
        if (item.spine_color) setDominantColor(item.spine_color);
        if (item.spine_color_accent) setAccentColor(item.spine_color_accent);
      } catch (err) {
        console.error('Failed to load item:', err);
      }
    };
    loadItem();
  }, [physicalItemId]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await apiService.updateSpineColors(physicalItemId, {
        spine_color: dominantColor,
        spine_color_accent: accentColor,
      });
      onSave();
    } catch (err) {
      console.error('Failed to save spine colors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoDetect = async () => {
    setIsAutoDetecting(true);
    try {
      const result = await apiService.updateSpineColors(physicalItemId, {
        auto_detect: true,
      });
      if (result.spine_color) setDominantColor(result.spine_color);
      if (result.spine_color_accent) setAccentColor(result.spine_color_accent);
    } catch (err) {
      console.error('Failed to auto-detect colors:', err);
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      await apiService.updateSpineColors(physicalItemId, {
        spine_color: null,
        spine_color_accent: null,
      });
      onSave();
    } catch (err) {
      console.error('Failed to reset spine colors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Spine Colors
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">
          {itemName}
        </p>

        {/* Color preview */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="w-10 h-32 rounded-md shadow-inner border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: dominantColor }}
          >
            <span
              className="text-[8px] font-medium select-none"
              style={{
                color: accentColor,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              {itemName.substring(0, 20)}
            </span>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Spine Color (Background)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={dominantColor}
                  onChange={(e) => setDominantColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={dominantColor}
                  onChange={(e) => setDominantColor(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Accent Color (Text)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleAutoDetect}
            disabled={isAutoDetecting}
            className="flex-1 px-3 py-1.5 text-xs text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors disabled:opacity-50"
          >
            {isAutoDetecting ? 'Detecting...' : 'Auto-detect from poster'}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpineColorPicker;
