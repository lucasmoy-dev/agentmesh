"use client";

import { useState } from "react";
import { Play, Eye, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PromptActionsProps {
  id: string;
  slug: string;
  enabled: boolean;
  lastResult: string | null;
  apiKey: string;
}

export function PromptActions({ id, slug, enabled, lastResult, apiKey }: PromptActionsProps) {
  const [loading, setLoading] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const res = await fetch(`/api/prompts/${id}/toggle`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setIsToggling(false);
    }
  };

  const handlePlay = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prompts/${slug}/run`, { method: "POST" });
      if (res.ok) {
        // Forzar refresco para ver el resultado de Gemini
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert("Error al conectar con Gemini");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
      <label className="switch" title={enabled ? "Desactivar" : "Activar"}>
        <input 
          type="checkbox" 
          checked={enabled} 
          onChange={handleToggle}
          disabled={isToggling}
        />
        <span className="slider round"></span>
      </label>

      <button 
        onClick={handlePlay}
        className={`btn btn-outline ${loading ? 'opacity-50' : ''}`}
        style={{ padding: '0.4rem' }}
        title="Ejecutar con Gemini"
        disabled={loading}
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
      </button>

      {lastResult && (
        <button 
          onClick={() => setShowResult(true)}
          className="btn btn-outline"
          style={{ padding: '0.4rem' }}
          title="Ver último resultado"
        >
          <Eye size={18} />
        </button>
      )}

      {showResult && (
        <div className="modal-overlay" onClick={() => setShowResult(false)}>
          <div className="glass-card modal-content" onClick={e => e.stopPropagation()}>
            <h3>Último Resultado: {slug}</h3>
            <pre style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#000', 
              borderRadius: '0.5rem',
              whiteSpace: 'pre-wrap',
              maxHeight: '400px',
              overflowY: 'auto',
              fontSize: '0.875rem'
            }}>
              {lastResult}
            </pre>
            <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => setShowResult(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
