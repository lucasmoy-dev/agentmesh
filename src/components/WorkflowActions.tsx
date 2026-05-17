"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Settings, Trash2, ScrollText, X, Loader2, ChevronDown, ChevronUp, CheckCircle2, XCircle, Play, AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WorkflowActionsProps {
  id: string;
  name: string;
}

export function WorkflowActions({ id, name }: WorkflowActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [executions, setExecutions] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [expandedExecutions, setExpandedExecutions] = useState<Record<string, boolean>>({});

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el workflow "${name}"?`)) return;

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

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workflows/${id}/executions`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setExecutions(data.executions || []);
          setNodes(data.nodes || []);
          
          // Auto-expandir la primera ejecución si existe
          if (data.executions && data.executions.length > 0) {
            setExpandedExecutions({ [data.executions[0].id]: true });
          }
        }
      }
    } catch (error) {
      console.error("Error al cargar los logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLogs = () => {
    setIsOpen(true);
    fetchLogs();
  };

  const toggleExecution = (execId: string) => {
    setExpandedExecutions(prev => ({
      ...prev,
      [execId]: !prev[execId]
    }));
  };

  const getNodeName = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) return node.name;
    return `Nodo [${nodeId.substring(0, 6)}]`;
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleOpenLogs}
          className="btn btn-outline p-2 hover:border-purple-500/50 hover:text-purple-400"
          title="Ver historial de ejecuciones"
        >
          <ScrollText size={18} />
        </button>
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

      {/* MODAL DE LOGS */}
      {isOpen && (
        <div className="modal-overlay">
          <div className="glass-card animate-modal-in w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-white/10" style={{ padding: 0 }}>
            {/* Cabecera del Modal */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ScrollText className="text-purple-500" size={22} />
                  Historial de Logs: {name}
                </h3>
                <p className="text-xs text-muted mt-1">Últimas 5 ejecuciones registradas en el sistema</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-muted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-black/10">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
                  <Loader2 className="animate-spin text-purple-500" size={36} />
                  <span className="text-sm font-medium">Consultando registros de ejecución...</span>
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-16 text-muted flex flex-col items-center justify-center gap-2">
                  <AlertCircle size={36} className="opacity-40" />
                  <span className="italic font-medium">Este workflow aún no tiene ninguna ejecución registrada en el sistema.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {executions.map((exec) => {
                    const isExpanded = !!expandedExecutions[exec.id];
                    const dateStr = new Date(exec.createdAt).toLocaleString(undefined, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    });

                    // Calcular duración total de la ejecución
                    const start = new Date(exec.createdAt).getTime();
                    const end = new Date(exec.updatedAt).getTime();
                    const durationSec = ((end - start) / 1000).toFixed(1);

                    return (
                      <div 
                        key={exec.id} 
                        className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                          exec.status === 'COMPLETED' 
                            ? 'border-emerald-500/20 bg-emerald-500/2' 
                            : exec.status === 'FAILED'
                            ? 'border-red-500/20 bg-red-500/2'
                            : 'border-blue-500/20 bg-blue-500/2'
                        }`}
                      >
                        {/* Cabecera de la Ejecución */}
                        <div 
                          onClick={() => toggleExecution(exec.id)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/2 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3">
                            {exec.status === 'COMPLETED' ? (
                              <CheckCircle2 className="text-emerald-400" size={20} />
                            ) : exec.status === 'FAILED' ? (
                              <XCircle className="text-red-400" size={20} />
                            ) : (
                              <Loader2 className="animate-spin text-blue-400" size={20} />
                            )}
                            <div>
                              <span className="font-bold text-sm text-white">{dateStr}</span>
                              <span className="text-[10px] text-muted ml-3 font-mono">ID: {exec.id}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted">{durationSec}s de duración</span>
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border uppercase tracking-wider ${
                              exec.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : exec.status === 'FAILED'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                              {exec.status === 'COMPLETED' ? 'Completado' : exec.status === 'FAILED' ? 'Fallo' : 'Corriendo'}
                            </span>
                            {isExpanded ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
                          </div>
                        </div>

                        {/* Pasos / Detalles de Ejecución */}
                        {isExpanded && (
                          <div className="p-4 border-t border-white/5 space-y-4 bg-black/20">
                            {exec.steps.length === 0 ? (
                              <div className="text-center py-4 text-xs text-muted italic">No se registraron pasos para esta ejecución.</div>
                            ) : (
                              <div className="space-y-3 pl-4 border-l border-white/10">
                                {exec.steps.map((step: any) => {
                                  // Calcular duración del paso
                                  const stepStart = new Date(step.createdAt).getTime();
                                  const stepEnd = step.finishedAt ? new Date(step.finishedAt).getTime() : null;
                                  const stepDuration = stepEnd ? `${((stepEnd - stepStart) / 1000).toFixed(1)}s` : 'Corriendo...';

                                  return (
                                    <div key={step.id} className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {step.status === 'COMPLETED' ? (
                                            <CheckCircle2 className="text-emerald-400" size={14} />
                                          ) : step.status === 'FAILED' ? (
                                            <XCircle className="text-red-400" size={14} />
                                          ) : step.status === 'RUNNING' ? (
                                            <Play className="text-blue-400 fill-blue-400" size={12} />
                                          ) : (
                                            <Clock className="text-muted" size={14} />
                                          )}
                                          <span className="text-xs font-bold text-white">{getNodeName(step.nodeId)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-muted">
                                          <span>{stepDuration}</span>
                                          <span className={`px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                                            step.status === 'COMPLETED'
                                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                              : step.status === 'FAILED'
                                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                              : step.status === 'RUNNING'
                                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                              : 'bg-white/5 text-muted border border-white/5'
                                          }`}>
                                            {step.status}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Consola del Paso */}
                                      {(step.output || step.error) && (
                                        <div className="pl-4">
                                          <div className="bg-black/60 border border-white/5 rounded-xl font-mono text-[11px] leading-relaxed p-4 max-h-56 overflow-y-auto select-text shadow-inner">
                                            {step.error && (
                                              <div className="text-red-400 whitespace-pre-wrap flex items-start gap-2">
                                                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                                <div>
                                                  <div className="font-bold text-red-300">ERROR DETECTADO:</div>
                                                  {step.error}
                                                </div>
                                              </div>
                                            )}
                                            {step.output && (
                                              <div className={`${step.error ? 'mt-3 border-t border-white/5 pt-3 text-muted' : 'text-emerald-400'} whitespace-pre-wrap`}>
                                                {!step.error && <div className="font-bold text-emerald-300 mb-1">SALIDA EXITOSA:</div>}
                                                {step.output}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="p-4 border-t border-white/5 flex justify-between items-center bg-white/2">
              <span className="text-[10px] text-muted">Las ejecuciones se guardan en la base de datos PostgreSQL de Neon.</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="btn btn-outline px-6 py-2 border-white/10 hover:bg-white/5 hover:text-white"
              >
                Cerrar Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
