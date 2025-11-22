import React, { useState, useRef, useEffect } from 'react';
import { PhysicalFormat, SortField, SortOrder, CollectionStatistics } from '../types';
import { useSidebar } from '../context/SidebarContext';

interface StickyHeaderProps {
  statistics: CollectionStatistics | null;
  isLoadingStats: boolean;
  searchQuery: string;
  format: PhysicalFormat | PhysicalFormat[];
  sortBy: SortField;
  sortOrder: SortOrder;
  selectedGenres: number[];
  selectedDecades: string[];
  availableGenres: Array<{ id: number; name: string }>;
  availableDecades: string[];
  onSearchChange: (query: string) => void;
  onFormatChange: (format: PhysicalFormat | PhysicalFormat[]) => void;
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
  onGenresChange: (genres: number[]) => void;
  onDecadesChange: (decades: string[]) => void;
  onClearFilters: () => void;
}

const StickyHeader: React.FC<StickyHeaderProps> = ({
  statistics,
  isLoadingStats,
  searchQuery,
  format,
  sortBy,
  sortOrder,
  selectedGenres,
  selectedDecades,
  availableGenres,
  availableDecades,
  onSearchChange,
  onFormatChange,
  onSortChange,
  onGenresChange,
  onDecadesChange,
  onClearFilters,
}) => {
  const { isCollapsed } = useSidebar();
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showDecadeDropdown, setShowDecadeDropdown] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const decadeDropdownRef = useRef<HTMLDivElement>(null);
  const formatDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setShowGenreDropdown(false);
      }
      if (decadeDropdownRef.current && !decadeDropdownRef.current.contains(event.target as Node)) {
        setShowDecadeDropdown(false);
      }
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleSortByChange = (newSortBy: SortField) => {
    if (newSortBy === sortBy) {
      // Toggle sort order
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for alphabetical sorts, descending for others
      const defaultOrder = ['title', 'series_sort', 'director_last_name'].includes(newSortBy) ? 'asc' : 'desc';
      onSortChange(newSortBy, defaultOrder);
    }
  };

  const handleGenreToggle = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      onGenresChange(selectedGenres.filter(id => id !== genreId));
    } else {
      onGenresChange([...selectedGenres, genreId]);
    }
  };

  const handleDecadeToggle = (decade: string) => {
    if (selectedDecades.includes(decade)) {
      onDecadesChange(selectedDecades.filter(d => d !== decade));
    } else {
      onDecadesChange([...selectedDecades, decade]);
    }
  };

  const handleFormatToggle = (formatValue: PhysicalFormat) => {
    if (formatValue === 'all') {
      onFormatChange('all');
      setShowFormatDropdown(false);
    } else {
      const formatArray = Array.isArray(format) ? format : (format === 'all' ? [] : [format]);
      if (formatArray.includes(formatValue)) {
        const newFormats = formatArray.filter(f => f !== formatValue);
        onFormatChange(newFormats.length === 0 ? 'all' : newFormats);
      } else {
        onFormatChange([...formatArray, formatValue]);
      }
    }
  };

  const formatDisplay = Array.isArray(format) 
    ? (format.length === 0 ? 'All Formats' : `${format.length} selected`)
    : (format === 'all' ? 'All Formats' : format);

  const hasActiveFilters = searchQuery || 
    (Array.isArray(format) ? format.length > 0 : format !== 'all') || 
    selectedGenres.length > 0 || 
    selectedDecades.length > 0;

  return (
    <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-gray-700 ${
      isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 py-4">
          {/* Statistics - Compact badges */}
          {statistics && !isLoadingStats && (
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                {statistics.totalPhysicalItems} Items
              </span>
              <span className="text-gray-400">|</span>
              <span className="px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                {statistics.totalMovies} Movies
              </span>
              {Object.entries(statistics.formatCounts).map(([fmt, count]) => (
                <React.Fragment key={fmt}>
                  <span className="text-gray-400">|</span>
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {count} {fmt === '4K UHD' ? '4K' : fmt === 'Blu-ray' ? 'BR' : fmt}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}

          {isLoadingStats && (
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="relative w-48">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100"
            />
            <svg
              className="absolute left-2.5 top-2 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Format Filter - Multi-select */}
          <div className="relative" ref={formatDropdownRef}>
            <button
              onClick={() => setShowFormatDropdown(!showFormatDropdown)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100 min-w-[100px] flex items-center justify-between"
            >
              <span className="text-xs">{formatDisplay}</span>
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showFormatDropdown && (
              <div className="absolute z-50 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2">
                  <label className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Array.isArray(format) ? format.length === 0 : format === 'all'}
                      onChange={() => handleFormatToggle('all')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs text-gray-900 dark:text-gray-100">All</span>
                  </label>
                  {(['4K UHD', 'Blu-ray', 'DVD', 'Digital-HD', 'Digital-SD', 'Digital-UHD', 'LaserDisc', 'VHS'] as PhysicalFormat[]).map((fmt) => {
                    const isChecked = Array.isArray(format) ? format.includes(fmt) : false;
                    return (
                      <label key={fmt} className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleFormatToggle(fmt)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs text-gray-900 dark:text-gray-100">{fmt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Genre Filter */}
          <div className="relative" ref={genreDropdownRef}>
            <button
              onClick={() => setShowGenreDropdown(!showGenreDropdown)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100 min-w-[90px] flex items-center justify-between"
            >
              <span className="text-xs">{selectedGenres.length === 0 ? 'All Genres' : `${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''}`}</span>
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showGenreDropdown && (
              <div className="absolute z-50 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2">
                  {availableGenres.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 p-2">No genres</p>
                  ) : (
                    availableGenres.map((genre) => (
                      <label key={genre.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGenres.includes(genre.id)}
                          onChange={() => handleGenreToggle(genre.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs text-gray-900 dark:text-gray-100">{genre.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Decade Filter */}
          <div className="relative" ref={decadeDropdownRef}>
            <button
              onClick={() => setShowDecadeDropdown(!showDecadeDropdown)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100 min-w-[90px] flex items-center justify-between"
            >
              <span className="text-xs">{selectedDecades.length === 0 ? 'All Decades' : `${selectedDecades.length} decade${selectedDecades.length > 1 ? 's' : ''}`}</span>
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDecadeDropdown && (
              <div className="absolute z-50 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2">
                  {availableDecades.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 p-2">No decades</p>
                  ) : (
                    availableDecades.map((decade) => (
                      <label key={decade} className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDecades.includes(decade)}
                          onChange={() => handleDecadeToggle(decade)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs text-gray-900 dark:text-gray-100">{decade}s</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sort buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSortByChange('title')}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                sortBy === 'title'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortByChange('series_sort')}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                sortBy === 'series_sort'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Series {sortBy === 'series_sort' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortByChange('director_last_name')}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                sortBy === 'director_last_name'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Director {sortBy === 'director_last_name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortByChange('release_date')}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                sortBy === 'release_date'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Year {sortBy === 'release_date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortByChange('created_at')}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                sortBy === 'created_at'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Added {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyHeader;

