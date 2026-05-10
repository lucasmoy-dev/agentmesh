"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NewWorkflowPage() {
  const router = useRouter();

  useEffect(() => {
    const createAndRedirect = async () => {
      try {
        const res = await fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Nueva Automatización" }),
        });
        const data = await res.json();
        router.push(`/workflows/${data.id}`);
      } catch (err) {
        console.error(err);
        router.push("/");
      }
    };

    createAndRedirect();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 size={48} className="animate-spin text-purple-500" />
      <h2 className="text-xl font-bold">Iniciando lienzo de automatización...</h2>
      <p className="opacity-50">Preparando nodos y motores de IA.</p>
    </div>
  );
}
