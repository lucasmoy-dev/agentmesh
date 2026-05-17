import { db } from "@/lib/prisma";
import Link from "next/link";
import { Plus, GitBranch, Clock, Calendar } from "lucide-react";
import { WorkflowPlayButton } from "@/components/WorkflowPlayButton";
import { WorkflowActions } from "@/components/WorkflowActions";
import { WorkflowToggle } from "@/components/WorkflowToggle";
import { DEFAULT_TIMEZONE, formatDateInTz, formatTimeInTz } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [workflows, tzSetting] = await Promise.all([
    db.workflow.findMany({
      include: {
        nodes: true,
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    db.systemSetting.findUnique({ where: { key: "TIMEZONE" } })
  ]);

  const tz = tzSetting?.value || DEFAULT_TIMEZONE;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold flex items-center gap-3">
            <GitBranch className="text-purple-500" /> Workflows
          </h1>
        </div>
        <Link href="/workflows/new" className="btn btn-primary flex items-center gap-2 shadow-lg shadow-purple-500/20">
          <Plus size={20} /> Nuevo Workflow
        </Link>
      </header>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 text-left">
                <th className="p-6 font-semibold text-xs uppercase tracking-wider">Workflow</th>
                <th className="p-6 font-semibold text-xs uppercase tracking-wider">Última Ejecución</th>
                <th className="p-6 font-semibold text-xs uppercase tracking-wider text-center">Estado</th>
                <th className="p-6 font-semibold text-xs uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((wf: any) => {
                const lastExecution = wf.executions?.[0];
                return (
                  <tr key={wf.id} className="border-b border-white/5 hover:bg-white/10 transition-all group">
                    <td className="p-6">
                      <div className="font-bold text-lg group-hover:text-purple-400 transition-colors">{wf.name}</div>
                      <div className="text-[10px] text-muted font-medium mt-1 flex items-center gap-1.5">
                        <Calendar size={10} />
                        Creado {formatDateInTz(new Date(wf.createdAt), tz)}
                      </div>
                    </td>
                    <td className="p-6">
                      {lastExecution ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                            <Clock size={14} />
                            {formatTimeInTz(new Date(lastExecution.createdAt), tz)}
                          </div>
                          <div className="text-[10px] text-muted font-medium">
                            {formatDateInTz(new Date(lastExecution.createdAt), tz)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted italic">Nunca ejecutado</div>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="flex justify-center">
                        <WorkflowToggle id={wf.id} initialStatus={wf.enabled} />
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-end gap-3">
                        <WorkflowPlayButton workflowId={wf.id} />
                        <div className="h-6 w-px bg-white/10 mx-1" />
                        <WorkflowActions id={wf.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {workflows.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-white/5 rounded-full">
                        <GitBranch size={48} className="text-muted opacity-20" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-bold">No hay workflows</p>
                        <p className="text-sm text-muted">Comienza creando tu primera automatización.</p>
                      </div>
                      <Link href="/workflows/new" className="btn btn-primary mt-2">
                        Crear Workflow
                      </Link>
                    </div>
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
