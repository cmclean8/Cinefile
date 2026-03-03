import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Shelf, ShelfPlacement, STANDARD_UNIT_MM } from '../../types';

/**
 * Generate a deterministic color from a string (client-side fallback).
 */
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hue = Math.abs(hash % 360);
  const sat = 40 + Math.abs((hash >> 8) % 30);
  const lit = 25 + Math.abs((hash >> 16) % 20);
  const s = sat / 100, l = lit / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.35 ? '#1a1a2e' : '#f0f0f0';
}

interface ShelfViewProps {
  shelf: Shelf;
  isEditMode: boolean;
  onEditShelf?: (shelf: Shelf) => void;
  onDeleteShelf?: (shelfId: number) => void;
  onRemovePlacement?: (placementId: number) => void;
  onItemClick?: (physicalItemId: number) => void;
  onSpineColorEdit?: (physicalItemId: number) => void;
}

// Calibre-style spine item
const SortableShelfItem: React.FC<{
  placement: ShelfPlacement;
  isEditMode: boolean;
  onRemove?: (placementId: number) => void;
  onClick?: (physicalItemId: number) => void;
  onSpineColorEdit?: (physicalItemId: number) => void;
}> = ({ placement, isEditMode, onRemove, onClick, onSpineColorEdit }) => {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `placement-${placement.id}`,
    data: {
      type: 'placement',
      placement,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const item = placement.physical_item;
  if (!item) return null;

  const thickness = (item as any).thickness_units || 1;
  const spineWidth = Math.max(24, thickness * 28);
  const coverUrl = (item as any).cover_art_url || (item as any).custom_image_url;
  const spineColor = (item as any).spine_color || hashColor(item.name);
  const spineAccent = (item as any).spine_color_accent || getContrastColor(spineColor);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isEditMode && onSpineColorEdit) {
      e.preventDefault();
      onSpineColorEdit(item.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, width: `${spineWidth}px`, zIndex: isHovered ? 20 : 1 }}
      className={`relative flex-shrink-0 h-full ${isDragging ? 'z-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
    >
      {/* Spine (default state) */}
      <div
        className="h-full w-full overflow-hidden border-r border-black/10 dark:border-white/10 cursor-pointer"
        style={{ backgroundColor: !coverUrl ? spineColor : undefined }}
        onClick={() => onClick?.(item.id)}
        title={`${item.name}${thickness > 1 ? ` (${thickness} units)` : ''}`}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          /* No cover art: solid color with vertical text */
          <div className="w-full h-full flex items-center justify-center relative">
            <span
              className="absolute text-[10px] font-medium leading-tight select-none whitespace-nowrap overflow-hidden text-ellipsis max-h-full"
              style={{
                color: spineAccent,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                maxWidth: '100%',
                padding: '4px 2px',
              }}
            >
              {item.name}
            </span>
          </div>
        )}
      </div>

      {/* Hover: Expanded poster overlay */}
      {isHovered && coverUrl && !isDragging && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: '120px',
            height: '180px',
            zIndex: 30,
            bottom: '-4px',
          }}
        >
          <div
            className="w-full h-full rounded-md shadow-2xl overflow-hidden border-2 border-white/80 dark:border-gray-600 pointer-events-auto cursor-pointer"
            onClick={() => onClick?.(item.id)}
          >
            <img
              src={coverUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {/* Title overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-4">
              <p className="text-[10px] font-medium text-white leading-tight truncate">
                {item.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hover: Expanded card for no-cover items */}
      {isHovered && !coverUrl && !isDragging && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: '120px',
            height: '180px',
            zIndex: 30,
            bottom: '-4px',
          }}
        >
          <div
            className="w-full h-full rounded-md shadow-2xl overflow-hidden border-2 border-white/80 dark:border-gray-600 pointer-events-auto cursor-pointer flex flex-col items-center justify-center"
            style={{ backgroundColor: spineColor }}
            onClick={() => onClick?.(item.id)}
          >
            <span
              className="text-xs font-semibold text-center px-2 leading-tight"
              style={{ color: spineAccent }}
            >
              {item.name}
            </span>
          </div>
        </div>
      )}

      {/* Remove button */}
      {isEditMode && isHovered && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(placement.id);
          }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] leading-none flex items-center justify-center hover:bg-red-600 z-40 shadow-md"
          title="Remove from shelf"
        >
          &times;
        </button>
      )}
    </div>
  );
};

const ShelfView: React.FC<ShelfViewProps> = ({
  shelf,
  isEditMode,
  onEditShelf,
  onDeleteShelf,
  onRemovePlacement,
  onItemClick,
  onSpineColorEdit,
}) => {
  const capacityPercent = shelf.capacity_units > 0
    ? Math.min(100, (shelf.used_units / shelf.capacity_units) * 100)
    : 0;
  const isOverCapacity = shelf.used_units > shelf.capacity_units;
  const widthMm = shelf.width_mm ?? shelf.capacity_units * STANDARD_UNIT_MM;
  const usedMm = shelf.used_units * STANDARD_UNIT_MM;

  const { isOver, setNodeRef } = useDroppable({
    id: `shelf-${shelf.id}`,
    data: {
      type: 'shelf',
      shelfId: shelf.id,
    },
  });

  const sortableIds = shelf.placements.map((p) => `placement-${p.id}`);

  return (
    <div className="mb-4">
      {/* Shelf header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {shelf.display_name}
          </h4>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            isOverCapacity
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {shelf.used_units} / {shelf.capacity_units} units
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            ({usedMm.toFixed(1)}mm / {widthMm.toFixed(1)}mm)
          </span>
        </div>

        {isEditMode && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditShelf?.(shelf)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Edit shelf"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => onDeleteShelf?.(shelf.id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete shelf"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Capacity bar */}
      <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isOverCapacity
              ? 'bg-red-500'
              : capacityPercent > 80
              ? 'bg-yellow-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(100, capacityPercent)}%` }}
        />
      </div>

      {/* Shelf visual - Calibre-style spine display */}
      <div
        ref={setNodeRef}
        className={`relative rounded-t-md overflow-visible transition-colors ${
          isOver
            ? 'bg-primary-50/50 dark:bg-primary-900/20'
            : 'bg-gray-50 dark:bg-gray-800/50'
        }`}
      >
        {shelf.placements.length === 0 ? (
          <div className="flex items-center justify-center h-[140px] text-xs text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-t-md">
            {isEditMode ? 'Drag items here' : 'Empty shelf'}
          </div>
        ) : (
          <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
            <div className="flex h-[140px] overflow-x-auto overflow-y-visible">
              {shelf.placements.map((placement) => (
                <SortableShelfItem
                  key={placement.id}
                  placement={placement}
                  isEditMode={isEditMode}
                  onRemove={onRemovePlacement}
                  onClick={onItemClick}
                  onSpineColorEdit={onSpineColorEdit}
                />
              ))}
            </div>
          </SortableContext>
        )}

        {/* Shelf edge - modern style */}
        <div className="h-2.5 bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-b-sm shadow-md" />
      </div>
    </div>
  );
};

export default ShelfView;
