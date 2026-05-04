import { addDays, addHours, addMinutes, addSeconds, addMonths, addYears, isAfter, set, startOfMinute } from "date-fns";

export type ScheduleType = "SINGLE" | "WEEKLY" | "MONTHLY" | "YEARLY" | "INTERVAL";

export interface ScheduleConfig {
  type: ScheduleType;
  days?: number[]; // 0-6 (Sunday-Saturday)
  time: string; // "HH:mm"
  date?: number; // 1-31
  month?: number; // 0-11
  intervalValue?: number;
  intervalUnit?: "seconds" | "minutes" | "hours";
}

export function calculateNextExecution(config: ScheduleConfig, from: Date = new Date()): Date {
  // For INTERVAL, we just add the time to 'from'
  if (config.type === "INTERVAL" && config.intervalValue && config.intervalUnit) {
    switch (config.intervalUnit) {
      case "seconds": return addSeconds(from, config.intervalValue);
      case "minutes": return addMinutes(from, config.intervalValue);
      case "hours": return addHours(from, config.intervalValue);
    }
  }

  const [hours, minutes] = config.time.split(":").map(Number);
  let next = set(startOfMinute(from), { hours, minutes, seconds: 0, milliseconds: 0 });

  switch (config.type) {
    case "SINGLE":
      return next;

    case "WEEKLY":
      if (!config.days || config.days.length === 0) return next;
      const sortedDays = [...config.days].sort();
      const currentDay = from.getDay();
      const nextDayThisWeek = sortedDays.find(d => d > currentDay || (d === currentDay && isAfter(next, from)));

      if (nextDayThisWeek !== undefined) {
        const diff = nextDayThisWeek - currentDay;
        return addDays(next, diff);
      } else {
        const firstDayNextWeek = sortedDays[0];
        const diff = 7 - currentDay + firstDayNextWeek;
        return addDays(next, diff);
      }

    case "MONTHLY":
      if (!config.date) return next;
      next = set(next, { date: config.date });
      if (isAfter(next, from)) return next;
      return addMonths(next, 1);

    case "YEARLY":
      if (config.month === undefined || !config.date) return next;
      next = set(next, { month: config.month, date: config.date });
      if (isAfter(next, from)) return next;
      return addYears(next, 1);

    default:
      return next;
  }
}
