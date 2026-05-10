import { db } from "./prisma";

// Evitar múltiples instancias en hot-reload
let schedulerStarted = false;

export function startScheduler(origin: string) {
  if (schedulerStarted) return;
  schedulerStarted = true;
  console.log(" [SCHEDULER] Iniciando motor de triggers en background...");

  setInterval(async () => {
    try {
      const now = new Date();
      // En un entorno real, usaríamos una consulta más compleja, 
      // pero para el lab, comprobaremos todos los workflows habilitados
      const workflows = await db.workflow.findMany({
        where: { enabled: true },
        include: { nodes: true }
      });

      for (const workflow of workflows) {
        const trigger = workflow.nodes.find(n => n.type.toLowerCase().includes("trigger"));
        if (!trigger) continue;

        const config = trigger.config as any;
        if (!config || config.scheduleType === "MANUAL") continue;

        if (shouldRun(config, now)) {
          console.log(` [SCHEDULER] Disparando workflow automático: ${workflow.name} (${workflow.id})`);
          // Ejecutar en background
          fetch(`${origin}/api/workflows/${workflow.id}/execute`, { method: "POST" }).catch(e => console.error(e));
        }
      }
    } catch (error) {
      console.error(" [SCHEDULER ERROR]", error);
    }
  }, 60000); // Comprobar cada minuto
}

function shouldRun(config: any, now: Date): boolean {
  const [targetH, targetM] = (config.time || "12:00").split(":").map(Number);
  const currentH = now.getHours();
  const currentM = now.getMinutes();

  // Comprobar la hora (margen de 1 minuto)
  if (currentH !== targetH || currentM !== targetM) {
    if (config.scheduleType !== "ONCE") return false;
  }

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const currentDayName = dayNames[now.getDay()];
  const currentDayOfMonth = now.getDate();
  const currentMonth = now.getMonth() + 1;

  switch (config.scheduleType) {
    case "DAILY":
      return true;
    case "WEEKLY":
      return (config.days || []).includes(currentDayName);
    case "MONTHLY":
      return config.dayOfMonth === currentDayOfMonth;
    case "ANNUALLY":
      return config.dayOfMonth === currentDayOfMonth && config.month === currentMonth;
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
    default:
      return false;
  }
}
