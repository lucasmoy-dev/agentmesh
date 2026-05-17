import { db } from "@/lib/prisma";
import Link from "next/link";
import { Plus, GitBranch, Clock, Calendar } from "lucide-react";
import { WorkflowPlayButton } from "@/components/WorkflowPlayButton";
import { WorkflowActions } from "@/components/WorkflowActions";
import { WorkflowToggle } from "@/components/WorkflowToggle";
import { DEFAULT_TIMEZONE, formatDateInTz, formatTimeInTz, nowInTz } from "@/lib/timezone";

export const dynamic = "force-dynamic";

function getNextExecution(workflow: any, tz: string): string {
  const trigger = workflow.nodes?.find((n: any) => n.type.toLowerCase().includes("trigger"));
  if (!trigger || !workflow.enabled) return "Inactivo / Manual";

  const config = trigger.config as any;
  if (!config || config.scheduleType === "MANUAL") return "Manual";

  const now = nowInTz(tz);
  const next = new Date(now);
  next.setSeconds(0, 0);

  const [h, m] = (config.time || "12:00").split(":").map(Number);
  next.setHours(h, m);

  if (next <= now) {
    if (config.scheduleType === "DAILY") {
      next.setDate(next.getDate() + 1);
    } else if (config.scheduleType === "WEEKLY" && config.days && config.days.length > 0) {
      const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      for (let i = 1; i <= 7; i++) {
        const d = new Date(next);
        d.setDate(d.getDate() + i);
        if (config.days.includes(dayNames[d.getDay()])) {
          next.setDate(d.getDate());
          break;
        }
      }
    } else if (config.scheduleType === "MONTHLY" && config.dayOfMonth) {
      next.setMonth(next.getMonth() + 1);
    } else if (config.scheduleType === "ANNUALLY" && config.dayOfMonth && config.month) {
      next.setFullYear(next.getFullYear() + 1);
    } else {
      next.setDate(next.getDate() + 1);
    }
  } else {
    if (config.scheduleType === "WEEKLY" && config.days && config.days.length > 0) {
      const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      if (!config.days.includes(dayNames[now.getDay()])) {
        for (let i = 1; i <= 7; i++) {
          const d = new Date(next);
          d.setDate(d.getDate() + i);
          if (config.days.includes(dayNames[d.getDay()])) {
            next.setDate(d.getDate());
            break;
          }
        }
      }
    } else if (config.scheduleType === "MONTHLY" && config.dayOfMonth && now.getDate() !== config.dayOfMonth) {
      next.setDate(config.dayOfMonth);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
    } else if (config.scheduleType === "ANNUALLY" && config.dayOfMonth && config.month && (now.getDate() !== config.dayOfMonth || (now.getMonth() + 1) !== config.month)) {
      next.setMonth(config.month - 1);
      next.setDate(config.dayOfMonth);
      if (next <= now) {
        next.setFullYear(next.getFullYear() + 1);
      }
    }
  }

  if (config.scheduleType === "ONCE") {
    if (!config.onceDate) return "Una vez (no programado)";
    const once = new Date(config.onceDate);
    if (once <= now) return "Ejecutado (Una vez)";
    return once.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return `${next.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;
}

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
                <th className="p-6 font-semibold text-xs uppercase tracking-wider">Próxima Ejecución</th>
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-purple-400">
                          <Clock size={14} />
                          {getNextExecution(wf, tz)}
                        </div>
                      </div>
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
                        <WorkflowActions id={wf.id} name={wf.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {workflows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
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
