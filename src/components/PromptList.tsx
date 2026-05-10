"use client";

import { useState, useEffect, useId } from "react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Settings } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { PromptActions } from "./PromptActions";

interface Prompt {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  scheduleType: string;
  scheduleTime: string;
  intervalValue: number | null;
  intervalUnit: string | null;
  nextExecutionAt: string;
  lastExecutedAt: string | null;
  lastResult: string | null;
}

interface SortableItemProps {
  prompt: Prompt;
  apiKey: string;
  mounted: boolean;
}

function SortableRow({ prompt, apiKey, mounted }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: prompt.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as const,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            {...(mounted ? attributes : {})} 
            {...(mounted ? listeners : {})} 
            style={{ cursor: mounted ? 'grab' : 'default', color: 'var(--muted)', display: 'flex' }}
          >
            <GripVertical size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className={`status-indicator ${prompt.enabled ? 'status-active' : 'status-inactive'}`} />
              <span style={{ fontWeight: 600 }}>{prompt.name}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              slug: {prompt.slug}
            </div>
          </div>
        </div>
      </td>
      <td>
        <div style={{ fontSize: '0.875rem' }}>
          <strong>{prompt.scheduleType}</strong>
          <br />
          <span style={{ color: 'var(--muted)' }}>
            {prompt.scheduleType === 'INTERVAL' 
              ? `Cada ${prompt.intervalValue} ${prompt.intervalUnit}` 
              : prompt.scheduleTime}
          </span>
        </div>
      </td>
      <td>
        <span style={{ fontSize: '0.875rem' }}>
          {!mounted ? '...' : prompt.lastExecutedAt 
            ? formatDistanceToNow(new Date(prompt.lastExecutedAt), { addSuffix: true, locale: es })
            : 'Nunca'}
        </span>
      </td>
      <td>
        <span style={{ fontSize: '0.875rem', color: prompt.enabled ? 'var(--foreground)' : 'var(--muted)' }}>
          {!mounted ? '...' : prompt.enabled 
            ? format(new Date(prompt.nextExecutionAt), "dd/MM HH:mm")
            : 'Desactivado'}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <PromptActions 
            id={prompt.id}
            slug={prompt.slug}
            enabled={prompt.enabled}
            lastResult={prompt.lastResult}
            apiKey={apiKey}
          />
          <Link href={`/prompts/${prompt.id}`} className="btn btn-outline" style={{ padding: '0.4rem' }}>
            <Settings size={18} />
          </Link>
        </div>
      </td>
    </tr>
  );
}

export function PromptList({ initialPrompts, apiKey }: { initialPrompts: Prompt[], apiKey: string }) {
  const [prompts, setPrompts] = useState(initialPrompts);
  const [mounted, setMounted] = useState(false);
  const id = useId();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = prompts.findIndex((p) => p.id === active.id);
      const newIndex = prompts.findIndex((p) => p.id === over.id);

      const newPrompts = arrayMove(prompts, oldIndex, newIndex);
      setPrompts(newPrompts);

      // Guardar el nuevo orden en la API
      try {
        await fetch("/api/prompts/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: newPrompts.map(p => p.id) }),
        });
      } catch (error) {
        console.error("Error saving order:", error);
      }
    }
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
      <DndContext 
        id={id}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Frecuencia</th>
              <th>Última Ejecución</th>
              <th>Próxima</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext 
              items={prompts.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {prompts.map((prompt) => (
                <SortableRow key={prompt.id} prompt={prompt} apiKey={apiKey} mounted={mounted} />
              ))}
            </SortableContext>
            {prompts.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                  No hay prompts creados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}
