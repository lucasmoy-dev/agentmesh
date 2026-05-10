import { db } from "./prisma";

export type ScheduleType = "SINGLE" | "DAILY" | "WEEKLY" | "MONTHLY" | "ANNUALLY" | "INTERVAL";

export interface ScheduleConfig {
  type: ScheduleType;
  time?: string; // HH:mm
  days?: number[]; // [0-6]
  date?: number; // 1-31
  month?: number; // 1-12
  intervalValue?: number;
  intervalUnit?: "minutes" | "hours" | "days";
}

export function calculateNextExecution(config: ScheduleConfig, from: Date = new Date()): Date {
  const next = new Date(from);
  next.setSeconds(0, 0);

  if (config.time) {
    const [h, m] = config.time.split(":").map(Number);
    next.setHours(h, m);
  }

  // Si la hora ya pasó hoy, avanzar al siguiente periodo
  if (next <= from && config.type !== "SINGLE") {
    if (config.type === "DAILY") next.setDate(next.getDate() + 1);
    if (config.type === "WEEKLY" && config.days) {
      // Buscar el siguiente día de la semana
      let found = false;
      for (let i = 1; i <= 7; i++) {
        const d = new Date(next);
        d.setDate(d.getDate() + i);
        if (config.days.includes(d.getDay())) {
          next.setDate(d.getDate());
          found = true;
          break;
        }
      }
    }
    if (config.type === "MONTHLY") next.setMonth(next.getMonth() + 1);
    if (config.type === "ANNUALLY") next.setFullYear(next.getFullYear() + 1);
  }

  return next;
}

let schedulerStarted = false;

export async function checkAndRunWorkflows(origin: string) {
  try {
    const now = new Date();
    const workflows = await db.workflow.findMany({
      where: { enabled: true },
      include: { nodes: true }
    });

    for (const workflow of workflows) {
      const trigger = workflow.nodes.find((n: any) => n.type.toLowerCase().includes("trigger"));
      if (!trigger) continue;

      const config = trigger.config as any;
      if (!config || config.scheduleType === "MANUAL") continue;

      if (shouldRun(config, now)) {
        console.log(` [SCHEDULER] Disparando workflow: ${workflow.name} (${workflow.id})`);
        fetch(`${origin}/api/workflows/${workflow.id}/execute`, { method: "POST" }).catch(e => console.error(e));
      }
    }
  } catch (error) {
    console.error(" [SCHEDULER ERROR]", error);
  }
}

export function startScheduler(origin: string) {
  if (schedulerStarted) return;
  schedulerStarted = true;
  console.log(" [SCHEDULER] Iniciando motor de triggers en background (Local Mode)...");

  setInterval(() => checkAndRunWorkflows(origin), 60000);
}

function shouldRun(config: any, now: Date): boolean {
  const [targetH, targetM] = (config.time || "12:00").split(":").map(Number);
  const currentH = now.getHours();
  const currentM = now.getMinutes();

  if (currentH !== targetH || currentM !== targetM) {
    if (config.scheduleType !== "ONCE") return false;
  }

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const currentDayName = dayNames[now.getDay()];
  const currentDayOfMonth = now.getDate();
  const currentMonth = now.getMonth() + 1;

  switch (config.scheduleType) {
    case "DAILY": return true;
    case "WEEKLY": return (config.days || []).includes(currentDayName);
    case "MONTHLY": return config.dayOfMonth === currentDayOfMonth;
    case "ANNUALLY": return config.dayOfMonth === currentDayOfMonth && config.month === currentMonth;
    case "ONCE":
      if (!config.onceDate) return false;
      const once = new Date(config.onceDate);
      return (
        once.getFullYear() === now.getFullYear() &&
        once.getMonth() === now.getMonth() &&
        once.getDate() === now.getDate() &&
        once.getHours() === now.getHours() &&
        once.getMinutes() === now.getMinutes()
      );
    default: return false;
  }
}
