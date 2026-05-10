import { db } from "@/lib/prisma";
import { Prompt } from "@prisma/client";
import { Terminal, Clock, Activity, Plus } from "lucide-react";
import { PromptList } from "@/components/PromptList";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PromptsPage() {
  const prompts: Prompt[] = await db.prompt.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prompts</h1>
          <p className="opacity-60">Gestiona tus prompts individuales y su programación.</p>
        </div>
        <Link href="/prompts/new" className="btn btn-primary flex items-center gap-2">
          <Plus size={20} /> Nuevo Prompt
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Activity size={20} color="var(--primary)" />
            <span style={{ fontWeight: 600 }}>Total Prompts</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{prompts.length}</div>
        </div>
        
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Terminal size={20} color="var(--accent)" />
            <span style={{ fontWeight: 600 }}>Activos</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>
            {prompts.filter((p: Prompt) => p.enabled).length}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Clock size={20} color="var(--muted)" />
            <span style={{ fontWeight: 600 }}>Próximas 24h</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>
            {prompts.filter((p: Prompt) => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              return p.enabled && new Date(p.nextExecutionAt) <= tomorrow;
            }).length}
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-bold">Listado de Prompts</h2>
          <p className="text-sm opacity-50">Arrastra para cambiar el orden de prioridad.</p>
        </div>
        <div className="p-4">
          <PromptList 
            initialPrompts={JSON.parse(JSON.stringify(prompts))} 
            apiKey={process.env.API_KEY_HASH || ""} 
          />
        </div>
      </div>
    </div>
  );
}
