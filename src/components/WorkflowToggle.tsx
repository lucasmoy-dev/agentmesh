"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WorkflowToggle({ id, initialStatus }: { id: string, initialStatus: boolean }) {
  const [enabled, setEnabled] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled })
      });
      if (res.ok) {
        setEnabled(!enabled);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <label className="switch" style={{ opacity: isLoading ? 0.5 : 1 }}>
        <input 
          type="checkbox" 
          checked={enabled} 
          onChange={toggle}
          disabled={isLoading}
        />
        <span className="slider round"></span>
      </label>
      <span style={{ fontSize: '10px', fontWeight: 'bold', color: enabled ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>
        {enabled ? "Activo" : "Inactivo"}
      </span>
    </div>
  );
}
