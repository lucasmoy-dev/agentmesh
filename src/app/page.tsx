import { db } from "@/lib/prisma";
import { Prompt } from "@prisma/client";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Terminal, Clock, Activity, Settings } from "lucide-react";
import { PromptActions } from "@/components/PromptActions";
import { LogoutButton } from "@/components/LogoutButton";
import { PromptList } from "@/components/PromptList";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const prompts: Prompt[] = await db.prompt.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="container">
      <nav className="nav">
        <div className="logo">AgentMesh Control</div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/api/prompts/info" target="_blank" className="btn btn-outline">API Info</Link>
          <LogoutButton />
          <Link href="/prompts/new" className="btn btn-primary">
            <Plus size={20} />
            Nuevo Prompt
          </Link>
        </div>
      </nav>

      <header style={{ marginBottom: '2rem' }}>
        <h1>Panel de Control</h1>
        <p style={{ color: 'var(--muted)' }}>Gestiona y monitorea tus prompts automatizados.</p>
      </header>

      <div className="grid">
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

      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h2>Prompts Configurados</h2>
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
          Arrastra para cambiar el orden de prioridad.
        </div>
        <PromptList 
          initialPrompts={JSON.parse(JSON.stringify(prompts))} 
          apiKey={process.env.API_KEY_HASH || ""} 
        />
      </div>
    </div>
  );
}
  );
}
