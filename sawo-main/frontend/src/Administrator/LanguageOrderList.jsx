import React from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import LanguageFlag from "../components/Header/LanguageFlag";
import { LOCALES } from "../i18n/translatedRoutes";

const LOCALE_BY_CODE = Object.fromEntries(LOCALES.map((l) => [l.code, l]));

function LanguageRow({ code, checked, disabled, onToggle, canMoveUp, canMoveDown, onMove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: code });
  const locale = LOCALE_BY_CODE[code] || { label: code, ready: true };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        position: "relative",
      }}
      className={`flex items-center gap-3 py-2.5 px-2 rounded-lg border bg-[var(--surface)] ${
        isDragging ? "border-[var(--brand)] shadow-lg" : "border-[var(--border-light)]"
      }`}
    >
      <button
        type="button"
        className="text-[var(--text-3)] hover:text-[var(--text)] cursor-grab active:cursor-grabbing touch-none px-1"
        aria-label={`Drag to reorder ${locale.label}`}
        {...attributes}
        {...listeners}
      >
        <i className="fas fa-grip-vertical" />
      </button>

      <span
        className="inline-block w-8 h-8 rounded-full overflow-hidden border border-[var(--border)] flex-shrink-0"
        aria-hidden="true"
      >
        <LanguageFlag code={code} className="w-full h-full block" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text)] flex items-center gap-2">
          {locale.label}
          {!locale.ready && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--warning-bg,#fef3c7)] text-[var(--warning,#92400e)]">
              Not translated yet
            </span>
          )}
        </p>
        <p className="text-xs text-[var(--text-3)] uppercase tracking-wide">{code}</p>
      </div>

      <div className="flex items-center">
        <button
          type="button"
          className="text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-30 px-1.5"
          aria-label={`Move ${locale.label} up`}
          disabled={disabled || !canMoveUp}
          onClick={() => onMove(code, -1)}
        >
          <i className="fas fa-chevron-up text-xs" />
        </button>
        <button
          type="button"
          className="text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-30 px-1.5"
          aria-label={`Move ${locale.label} down`}
          disabled={disabled || !canMoveDown}
          onClick={() => onMove(code, 1)}
        >
          <i className="fas fa-chevron-down text-xs" />
        </button>
      </div>

      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onToggle(code, e.target.checked)}
        />
        <div className="w-11 h-6 bg-[var(--border)] peer-checked:bg-[var(--brand)] rounded-full peer transition-colors relative peer-disabled:opacity-50">
          <div
            className={`absolute top-0.5 left-0.5 bg-[var(--surface)] w-5 h-5 rounded-full shadow transition-transform ${
              checked ? "translate-x-5" : ""
            }`}
          />
        </div>
      </label>
    </div>
  );
}

// Drag-to-reorder list of every built language, top to bottom = the order
// the public switcher shows them in. `disabled` freezes it while a save is
// in flight (or the whole switcher is off, same as the old toggle list).
export default function LanguageOrderList({ order, enabledLanguages, disabled, onReorder, onToggle }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = order.indexOf(active.id);
    const to = order.indexOf(over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(order, from, to));
  };

  const handleMove = (code, delta) => {
    const from = order.indexOf(code);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= order.length) return;
    onReorder(arrayMove(order, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {order.map((code, i) => (
            <LanguageRow
              key={code}
              code={code}
              checked={enabledLanguages.includes(code)}
              disabled={disabled}
              onToggle={onToggle}
              onMove={handleMove}
              canMoveUp={i > 0}
              canMoveDown={i < order.length - 1}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
