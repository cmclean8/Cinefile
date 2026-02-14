import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { PhysicalLibrary, ShelfGroup, Shelf, STANDARD_UNIT_MM } from '../types';
import { apiService } from '../services/api.service';
import { useAuth } from '../context/AuthContext';
import { useServerMode } from '../context/ServerModeContext';
import ShelfGroupCard from '../components/library/ShelfGroupCard';
import UnassignedItemsPanel from '../components/library/UnassignedItemsPanel';
import ApplySortModal from '../components/library/ApplySortModal';
import SpineColorPicker from '../components/library/SpineColorPicker';

const PhysicalLibraryPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isReadOnly } = useServerMode();
  const canEdit = isAuthenticated && !isReadOnly;

  const [library, setLibrary] = useState<PhysicalLibrary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Panel state
  const [isUnassignedOpen, setIsUnassignedOpen] = useState(false);
  const [unassignedRefreshKey, setUnassignedRefreshKey] = useState(0);

  // Modal state
  const [showApplySort, setShowApplySort] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddShelf, setShowAddShelf] = useState<number | null>(null); // group id
  const [editingGroup, setEditingGroup] = useState<ShelfGroup | null>(null);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);

  // Form state for inline modals
  const [formName, setFormName] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formCapacity, setFormCapacity] = useState(10);

  // Library name editing
  const [isEditingLibraryName, setIsEditingLibraryName] = useState(false);
  const [libraryDisplayName, setLibraryDisplayName] = useState('');

  // Spine color editing
  const [editingSpineColorItemId, setEditingSpineColorItemId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const loadLibrary = useCallback(async () => {
    try {
      const data = await apiService.getLibrary();
      setLibrary(data);
      setLibraryDisplayName(data.display_name);
      setError(null);
    } catch (err) {
      console.error('Failed to load library:', err);
      setError('Failed to load physical library');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // =============================================
  // Drag handlers
  // =============================================
  const handleDragStart = (_event: DragStartEvent) => {
    // Could track active drag for overlay in the future
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Dragging an unassigned item onto a shelf
    if (activeData?.type === 'unassigned-item' && overData?.type === 'shelf') {
      const physicalItemId = activeData.physicalItemId;
      const shelfId = overData.shelfId;

      try {
        await apiService.placeItemOnShelf(shelfId, physicalItemId);
        await loadLibrary();
        setUnassignedRefreshKey((k) => k + 1);
      } catch (err) {
        console.error('Failed to place item:', err);
      }
    }
  };

  // =============================================
  // CRUD handlers
  // =============================================
  const handleAddGroup = async () => {
    if (!formName.trim() || !formDisplayName.trim()) return;
    try {
      await apiService.createShelfGroup({
        name: formName.trim().toLowerCase().replace(/\s+/g, '_'),
        display_name: formDisplayName.trim(),
      });
      await loadLibrary();
      setShowAddGroup(false);
      setFormName('');
      setFormDisplayName('');
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const handleEditGroup = async () => {
    if (!editingGroup || !formDisplayName.trim()) return;
    try {
      await apiService.updateShelfGroup(editingGroup.id, {
        display_name: formDisplayName.trim(),
        name: formName.trim().toLowerCase().replace(/\s+/g, '_'),
      });
      await loadLibrary();
      setEditingGroup(null);
      setFormName('');
      setFormDisplayName('');
    } catch (err) {
      console.error('Failed to update group:', err);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Delete this group? All shelves and item placements in this group will be removed. Items will become unassigned.')) return;
    try {
      await apiService.deleteShelfGroup(groupId);
      await loadLibrary();
      setUnassignedRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Failed to delete group:', err);
    }
  };

  const handleAddShelf = async () => {
    if (showAddShelf === null || !formName.trim() || !formDisplayName.trim()) return;
    try {
      await apiService.createShelf(showAddShelf, {
        name: formName.trim().toLowerCase().replace(/\s+/g, '_'),
        display_name: formDisplayName.trim(),
        capacity_units: formCapacity,
      });
      await loadLibrary();
      setShowAddShelf(null);
      setFormName('');
      setFormDisplayName('');
      setFormCapacity(10);
    } catch (err) {
      console.error('Failed to create shelf:', err);
    }
  };

  const handleEditShelf = async () => {
    if (!editingShelf || !formDisplayName.trim()) return;
    try {
      await apiService.updateShelf(editingShelf.id, {
        display_name: formDisplayName.trim(),
        name: formName.trim().toLowerCase().replace(/\s+/g, '_'),
        capacity_units: formCapacity,
      });
      await loadLibrary();
      setEditingShelf(null);
      setFormName('');
      setFormDisplayName('');
      setFormCapacity(10);
    } catch (err) {
      console.error('Failed to update shelf:', err);
    }
  };

  const handleDeleteShelf = async (shelfId: number) => {
    if (!confirm('Delete this shelf? Items on this shelf will become unassigned.')) return;
    try {
      await apiService.deleteShelf(shelfId);
      await loadLibrary();
      setUnassignedRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Failed to delete shelf:', err);
    }
  };

  const handleRemovePlacement = async (placementId: number) => {
    try {
      await apiService.removePlacement(placementId);
      await loadLibrary();
      setUnassignedRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Failed to remove placement:', err);
    }
  };

  const handleUpdateLibraryName = async () => {
    if (!libraryDisplayName.trim()) return;
    try {
      await apiService.updateLibrary({ display_name: libraryDisplayName.trim() });
      await loadLibrary();
      setIsEditingLibraryName(false);
    } catch (err) {
      console.error('Failed to update library name:', err);
    }
  };

  const handleApplySortConfirm = async () => {
    await loadLibrary();
    setUnassignedRefreshKey((k) => k + 1);
  };

  // Open edit forms with pre-filled data
  const openEditGroup = (group: ShelfGroup) => {
    setFormName(group.name);
    setFormDisplayName(group.display_name);
    setEditingGroup(group);
  };

  const openEditShelf = (shelf: Shelf) => {
    setFormName(shelf.name);
    setFormDisplayName(shelf.display_name);
    setFormCapacity(shelf.capacity_units);
    setEditingShelf(shelf);
  };

  const openAddShelf = (groupId: number) => {
    setFormName('');
    setFormDisplayName('');
    setFormCapacity(10);
    setShowAddShelf(groupId);
  };

  const openAddGroup = () => {
    setFormName('');
    setFormDisplayName('');
    setShowAddGroup(true);
  };

  // =============================================
  // Render
  // =============================================
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading physical library...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !library) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-red-600 dark:text-red-400">{error || 'Library not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {isEditingLibraryName && canEdit ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={libraryDisplayName}
                    onChange={(e) => setLibraryDisplayName(e.target.value)}
                    className="text-2xl font-bold bg-transparent border-b-2 border-primary-500 outline-none text-gray-900 dark:text-gray-100"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateLibraryName();
                      if (e.key === 'Escape') setIsEditingLibraryName(false);
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateLibraryName}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <h1
                  className={`text-2xl font-bold text-gray-900 dark:text-gray-100 ${
                    canEdit ? 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400' : ''
                  }`}
                  onClick={() => canEdit && setIsEditingLibraryName(true)}
                  title={canEdit ? 'Click to rename' : undefined}
                >
                  {library.display_name}
                </h1>
              )}

              {/* Stats summary */}
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{library.groups.length} groups</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span>
                  {library.groups.reduce((sum, g) => sum + g.shelves.length, 0)} shelves
                </span>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowApplySort(true)}
                  className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Apply Sort
                </button>
                <button
                  onClick={openAddGroup}
                  className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add Group
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Groups */}
        {library.groups.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Shelf Groups Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Create a group to start organizing your physical media. Groups represent rooms or areas.
            </p>
            {canEdit && (
              <button
                onClick={openAddGroup}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create Your First Group
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {library.groups.map((group) => (
              <ShelfGroupCard
                key={group.id}
                group={group}
                isEditMode={canEdit}
                onEditGroup={openEditGroup}
                onDeleteGroup={handleDeleteGroup}
                onAddShelf={openAddShelf}
                onEditShelf={openEditShelf}
                onDeleteShelf={handleDeleteShelf}
                onRemovePlacement={handleRemovePlacement}
                onSpineColorEdit={(itemId) => setEditingSpineColorItemId(itemId)}
              />
            ))}
          </div>
        )}

        {/* Unassigned Items - Inline collapsible section */}
        {canEdit && (
          <UnassignedItemsPanel
            isOpen={isUnassignedOpen}
            onToggle={() => setIsUnassignedOpen(!isUnassignedOpen)}
            refreshKey={unassignedRefreshKey}
          />
        )}
      </div>

      {/* Spine Color Picker Modal */}
      {editingSpineColorItemId !== null && (
        <SpineColorPicker
          physicalItemId={editingSpineColorItemId}
          onClose={() => setEditingSpineColorItemId(null)}
          onSave={async () => {
            await loadLibrary();
            setEditingSpineColorItemId(null);
          }}
        />
      )}

      {/* Apply Sort Modal */}
      <ApplySortModal
        isOpen={showApplySort}
        onClose={() => setShowApplySort(false)}
        onConfirm={handleApplySortConfirm}
      />

      {/* =============================================
          Inline Modals for Add/Edit Group and Shelf
          ============================================= */}

      {/* Add Group Modal */}
      {showAddGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddGroup(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Shelf Group</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => {
                    setFormDisplayName(e.target.value);
                    setFormName(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                  }}
                  placeholder="e.g., Living Room"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddGroup(false)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={handleAddGroup} disabled={!formDisplayName.trim()} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingGroup(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Shelf Group</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => {
                    setFormDisplayName(e.target.value);
                    setFormName(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleEditGroup()}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingGroup(null)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={handleEditGroup} disabled={!formDisplayName.trim()} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shelf Modal */}
      {showAddShelf !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddShelf(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Shelf</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => {
                    setFormDisplayName(e.target.value);
                    setFormName(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                  }}
                  placeholder="e.g., Top Shelf"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacity (standard Blu-ray cases)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    = {(formCapacity * STANDARD_UNIT_MM).toFixed(1)}mm
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddShelf(null)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button
                onClick={handleAddShelf}
                disabled={!formDisplayName.trim()}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                onKeyDown={(e) => e.key === 'Enter' && handleAddShelf()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shelf Modal */}
      {editingShelf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingShelf(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Shelf</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => {
                    setFormDisplayName(e.target.value);
                    setFormName(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacity (standard Blu-ray cases)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    = {(formCapacity * STANDARD_UNIT_MM).toFixed(1)}mm
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingShelf(null)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={handleEditShelf} disabled={!formDisplayName.trim()} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};

export default PhysicalLibraryPage;
