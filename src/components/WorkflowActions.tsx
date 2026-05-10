"use client";

import React from 'react';
import Link from 'next/link';
import { Settings, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WorkflowActionsProps {
  id: string;
}

export function WorkflowActions({ id }: WorkflowActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este workflow?')) return;

    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert('Error al eliminar el workflow');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link 
        href={`/workflows/${id}`} 
        className="btn btn-outline p-2 hover:border-blue-500/50 hover:text-blue-400"
        title="Editar Workflow"
      >
        <Settings size={18} />
      </Link>
      <button 
        onClick={handleDelete}
        className="btn btn-outline p-2 hover:border-red-500/50 hover:text-red-400"
        title="Eliminar Workflow"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
