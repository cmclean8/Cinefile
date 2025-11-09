import React, { useState, useEffect } from 'react';
import { Series, Media } from '../types';
import { apiService } from '../services/api.service';

const SeriesManager: React.FC = () => {
  const [series, setSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [seriesMovies, setSeriesMovies] = useState<Media[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sort_name: '',
    tmdb_collection_id: '',
    internal_sort_method: 'chronological' as 'chronological' | 'custom' | 'alphabetical',
  });
  const [sortOrders, setSortOrders] = useState<Record<number, number | null>>({});
  const [hasSortOrderChanges, setHasSortOrderChanges] = useState(false);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getSeries();
      setSeries(data);
    } catch (error) {
      console.error('Failed to load series:', error);
      alert('Failed to load series. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        name: formData.name,
        sort_name: formData.sort_name,
        tmdb_collection_id: formData.tmdb_collection_id ? parseInt(formData.tmdb_collection_id) : undefined,
        internal_sort_method: formData.internal_sort_method,
      };

      if (editingSeries) {
        await apiService.updateSeries(editingSeries.id, data);
        // Save sort orders if there are changes
        if (hasSortOrderChanges && editingSeries) {
          const sortOrdersArray = Object.entries(sortOrders).map(([mediaId, sortOrder]) => ({
            media_id: parseInt(mediaId),
            sort_order: sortOrder,
          }));
          await apiService.bulkUpdateSeriesMovieSortOrders(editingSeries.id, sortOrdersArray);
          setHasSortOrderChanges(false);
        }
      } else {
        await apiService.createSeries(data);
      }

      setFormData({ name: '', sort_name: '', tmdb_collection_id: '', internal_sort_method: 'chronological' });
      setEditingSeries(null);
      setShowAddForm(false);
      setSeriesMovies([]);
      setSortOrders({});
      setHasSortOrderChanges(false);
      await loadSeries();
    } catch (error) {
      console.error('Failed to save series:', error);
      alert('Failed to save series. Please try again.');
    }
  };

  const handleEdit = async (s: Series) => {
    setEditingSeries(s);
    setFormData({
      name: s.name,
      sort_name: s.sort_name,
      tmdb_collection_id: s.tmdb_collection_id?.toString() || '',
      internal_sort_method: s.internal_sort_method || 'chronological',
    });
    setShowAddForm(true);
    
    // Load movies for this series
    setIsLoadingMovies(true);
    try {
      const movies = await apiService.getSeriesMovies(s.id);
      setSeriesMovies(movies);
      // Initialize sort orders from movies
      const initialSortOrders: Record<number, number | null> = {};
      movies.forEach(movie => {
        const movieSeries = (movie as any).sort_order;
        initialSortOrders[movie.id] = movieSeries !== undefined ? movieSeries : null;
      });
      setSortOrders(initialSortOrders);
      setHasSortOrderChanges(false);
    } catch (error) {
      console.error('Failed to load series movies:', error);
    } finally {
      setIsLoadingMovies(false);
    }
  };

  const handleSortOrderChange = (mediaId: number, value: string) => {
    const numValue = value === '' ? null : parseInt(value);
    if (isNaN(numValue as any) && numValue !== null) return;
    
    setSortOrders(prev => ({
      ...prev,
      [mediaId]: numValue,
    }));
    setHasSortOrderChanges(true);
  };

  const handleSaveSortOrders = async () => {
    if (!editingSeries) return;
    
    try {
      const sortOrdersArray = Object.entries(sortOrders).map(([mediaId, sortOrder]) => ({
        media_id: parseInt(mediaId),
        sort_order: sortOrder,
      }));
      await apiService.bulkUpdateSeriesMovieSortOrders(editingSeries.id, sortOrdersArray);
      setHasSortOrderChanges(false);
      // Reload movies to get updated order
      const movies = await apiService.getSeriesMovies(editingSeries.id);
      setSeriesMovies(movies);
      alert('Sort orders saved successfully!');
    } catch (error) {
      console.error('Failed to save sort orders:', error);
      alert('Failed to save sort orders. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this series? This will remove it from all movies.')) return;

    try {
      await apiService.deleteSeries(id);
      await loadSeries();
    } catch (error) {
      console.error('Failed to delete series:', error);
      alert('Failed to delete series. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', sort_name: '', tmdb_collection_id: '', internal_sort_method: 'chronological' });
    setEditingSeries(null);
    setShowAddForm(false);
    setSeriesMovies([]);
    setSortOrders({});
    setHasSortOrderChanges(false);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading series...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Series</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add Series'}
        </button>
      </div>

      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {editingSeries ? 'Edit Series' : 'Add New Series'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort Name *
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (Used for alphabetical sorting, e.g., "Marvel Cinematic Universe, The")
                </span>
              </label>
              <input
                type="text"
                value={formData.sort_name}
                onChange={(e) => setFormData({ ...formData, sort_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                TMDb Collection ID
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Optional)</span>
              </label>
              <input
                type="number"
                value={formData.tmdb_collection_id}
                onChange={(e) => setFormData({ ...formData, tmdb_collection_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Internal Sort Method *
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (How movies within this series should be sorted)
                </span>
              </label>
              <select
                value={formData.internal_sort_method}
                onChange={(e) => setFormData({ ...formData, internal_sort_method: e.target.value as 'chronological' | 'custom' | 'alphabetical' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="chronological">Chronological (by release date)</option>
                <option value="custom">Custom (by sort order number)</option>
                <option value="alphabetical">Alphabetical (by title)</option>
              </select>
            </div>

            {editingSeries && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">Movies in Series</h4>
                  {hasSortOrderChanges && formData.internal_sort_method === 'custom' && (
                    <button
                      type="button"
                      onClick={handleSaveSortOrders}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Save Sort Orders
                    </button>
                  )}
                </div>
                
                {isLoadingMovies ? (
                  <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading movies...</div>
                ) : seriesMovies.length === 0 ? (
                  <div className="text-center py-4 text-gray-600 dark:text-gray-400">No movies in this series yet.</div>
                ) : (
                  <div className="space-y-2">
                    {seriesMovies.map((movie) => (
                      <div
                        key={movie.id}
                        className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{movie.title}</div>
                          {movie.release_date && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(movie.release_date).getFullYear()}
                            </div>
                          )}
                        </div>
                        {formData.internal_sort_method === 'custom' && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700 dark:text-gray-300">Sort Order:</label>
                            <input
                              type="number"
                              value={sortOrders[movie.id] ?? ''}
                              onChange={(e) => handleSortOrderChange(movie.id, e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Order"
                            />
                          </div>
                        )}
                        {formData.internal_sort_method !== 'custom' && (movie as any).sort_order !== undefined && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Order: {(movie as any).sort_order ?? '—'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingSeries ? 'Update' : 'Create'} Series
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {series.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No series created yet.</p>
          <button onClick={() => setShowAddForm(true)} className="btn-primary">
            Create Your First Series
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {series.map((s) => (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{s.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sort name: {s.sort_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Internal sort: {s.internal_sort_method === 'chronological' ? 'Chronological' : s.internal_sort_method === 'custom' ? 'Custom' : 'Alphabetical'}
                  </p>
                  {s.tmdb_collection_id && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      TMDb Collection ID: {s.tmdb_collection_id}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(s)}
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeriesManager;

