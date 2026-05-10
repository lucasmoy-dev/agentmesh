"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GitBranch, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Workflow {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: string;
}

export default function WorkflowList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows');
      const data = await res.json();
      setWorkflows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const createWorkflow = async () => {
    const res = await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Automatización Gemini" })
    });
    const newWorkflow = await res.json();
    router.push(`/workflows/${newWorkflow.id}`);
  };

  if (loading) return <div className="text-center py-10 opacity-50">Cargando workflows...</div>;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GitBranch className="text-purple-500" /> Mis Workflows
        </h2>
        <button onClick={createWorkflow} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((wf) => (
          <div key={wf.id} className="glass-card p-6 hover:border-purple-500 transition-all group">
            <h3 className="text-xl font-semibold mb-2">{wf.name}</h3>
            <p className="text-xs opacity-50 mb-4">Creado el {new Date(wf.createdAt).toLocaleDateString()}</p>
            
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded ${wf.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {wf.enabled ? 'Activo' : 'Inactivo'}
              </span>
              <Link href={`/workflows/${wf.id}`} className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-bold transition-colors">
                Editar <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ))}
        
        {workflows.length === 0 && (
          <div className="col-span-full py-12 border-2 border-dashed border-white/10 rounded-2xl text-center opacity-50">
            No tienes workflows creados aún. Empieza creando uno nuevo.
          </div>
        )}
      </div>
    </div>
  );
}
