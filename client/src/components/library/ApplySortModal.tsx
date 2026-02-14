import React, { useState, useEffect } from 'react';
import { ApplySortPreview } from '../../types';
import { apiService } from '../../services/api.service';

interface ApplySortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ApplySortModal: React.FC<ApplySortModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [preview, setPreview] = useState<ApplySortPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }
  }, [isOpen, sortBy, sortOrder]);

  const generatePreview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.previewApplySort(sortBy, sortOrder);
      setPreview(data);
    } catch (err) {
      console.error('Failed to generate preview:', err);
      setError('Failed to generate sort preview. Make sure you have shelves created first.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setIsApplying(true);
    try {
      await apiService.confirmApplySort(
        preview.placements.map((shelf) => ({
          shelf_id: shelf.shelf_id,
          items: shelf.items.map((item) => ({
            physical_item_id: item.physical_item_id,
            position: item.position,
          })),
        }))
      );
      onConfirm();
      onClose();
    } catch (err) {
      console.error('Failed to apply sort:', err);
      setError('Failed to apply sort. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Apply Virtual Sort to Shelves
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sort options */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="title">Title</option>
              <option value="release_date">Release Date</option>
              <option value="created_at">Date Added</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          ) : preview ? (
            <>
              {/* Shelf previews */}
              {preview.placements.map((shelf) => (
                <div
                  key={shelf.shelf_id}
                  className={`rounded-lg border p-3 ${
                    shelf.overflow
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {shelf.shelf_display_name}
                      {(shelf as any).group_display_name && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          ({(shelf as any).group_display_name})
                        </span>
                      )}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      shelf.overflow
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {shelf.used_units} / {shelf.capacity_units} units
                    </span>
                  </div>
                  {shelf.items.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {shelf.items.map((item) => (
                        <span
                          key={item.physical_item_id}
                          className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                          title={`${item.physical_item_name} (${item.thickness_units} unit${item.thickness_units > 1 ? 's' : ''})`}
                        >
                          {item.physical_item_name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">Empty</p>
                  )}
                </div>
              ))}

              {/* Unplaceable items */}
              {preview.unplaceable.length > 0 && (
                <div className="rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10 p-3">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                    Won't fit ({preview.unplaceable.length} items)
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {preview.unplaceable.map((item) => (
                      <span
                        key={item.physical_item_id}
                        className="text-[10px] px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded"
                      >
                        {item.physical_item_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isApplying || isLoading || !preview || preview.placements.length === 0}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isApplying ? 'Applying...' : 'Apply Sort'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplySortModal;
