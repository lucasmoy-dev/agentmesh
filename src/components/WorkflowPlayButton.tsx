"use client";

import { useState } from "react";
import { Play, Loader2, CheckCircle2 } from "lucide-react";

export function WorkflowPlayButton({ workflowId }: { workflowId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handlePlay = async () => {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/execute`, { method: "POST" });
      if (res.ok) {
        setDone(true);
        setTimeout(() => setDone(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert("Error al ejecutar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePlay}
      disabled={loading}
      className={`btn ${done ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'btn-outline border-blue-500/30 text-blue-400'} p-2 hover:bg-blue-500/10 transition-all`}
      title="Ejecutar ahora"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : done ? (
        <CheckCircle2 size={18} />
      ) : (
        <Play size={18} fill="currentColor" />
      )}
    </button>
  );
}
