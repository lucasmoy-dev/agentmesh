import { db } from "@/lib/prisma";
import { Prompt } from "@prisma/client";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Terminal, Clock, Activity, Settings } from "lucide-react";
import { PromptActions } from "@/components/PromptActions";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const prompts: Prompt[] = await db.prompt.findMany({
    orderBy: { createdAt: "desc" },
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
        <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
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
              {prompts.map((prompt: Prompt) => (
                <tr key={prompt.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className={`status-indicator ${prompt.enabled ? 'status-active' : 'status-inactive'}`} />
                      <span style={{ fontWeight: 600 }}>{prompt.name}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                      slug: {prompt.slug}
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
                      {prompt.lastExecutedAt 
                        ? formatDistanceToNow(new Date(prompt.lastExecutedAt), { addSuffix: true, locale: es })
                        : 'Nunca'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.875rem', color: prompt.enabled ? 'var(--foreground)' : 'var(--muted)' }}>
                      {prompt.enabled 
                        ? format(new Date(prompt.nextExecutionAt), "dd/MM HH:mm")
                        : 'Desactivado'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <PromptActions 
                        promptId={prompt.id}
                        slug={prompt.slug}
                        enabled={prompt.enabled}
                        lastResult={prompt.lastResult}
                      />
                      <Link href={`/prompts/${prompt.id}`} className="btn btn-outline" style={{ padding: '0.4rem' }}>
                        <Settings size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {prompts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                    No hay prompts creados. Comienza creando uno nuevo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
