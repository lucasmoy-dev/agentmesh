/**
 * timezone.ts — Utilidades para manejar la zona horaria configurada en el sistema.
 *
 * Vercel corre en UTC. Todos los `new Date()` son UTC. Este helper
 * convierte fechas al timezone del usuario usando la API Intl nativa de Node.js,
 * sin dependencias externas.
 */

/** Zona horaria por defecto si el usuario no configuró ninguna */
export const DEFAULT_TIMEZONE = "America/Mexico_City";

/**
 * Retorna la fecha/hora actual ajustada a la zona horaria indicada.
 * Devuelve un objeto Date "ficticio" cuyo valor numérico refleja la hora local.
 * Útil para comparar horas en el scheduler.
 */
export function nowInTz(tz: string = DEFAULT_TIMEZONE): Date {
  // Usamos Intl.DateTimeFormat para extraer las partes en la TZ del usuario
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts: Record<string, string> = {};
  formatter.formatToParts(new Date()).forEach(({ type, value }) => {
    parts[type] = value;
  });

  // Construimos un Date local con esos valores para poder usar getHours(), getDay(), etc.
  return new Date(
    parseInt(parts.year),
    parseInt(parts.month) - 1,
    parseInt(parts.day),
    parseInt(parts.hour) === 24 ? 0 : parseInt(parts.hour),
    parseInt(parts.minute),
    parseInt(parts.second)
  );
}

/**
 * Formatea una fecha para mostrar al usuario en su zona horaria.
 * Equivale a toLocaleDateString() pero con la TZ correcta.
 */
export function formatDateInTz(date: Date, tz: string = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Formatea fecha + hora para mostrar al usuario en su zona horaria.
 * Equivale a toLocaleString() pero con la TZ correcta.
 */
export function formatDateTimeInTz(date: Date, tz: string = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Formatea solo la hora para mostrar al usuario en su zona horaria.
 * Equivale a toLocaleTimeString() pero con la TZ correcta.
 */
export function formatTimeInTz(date: Date, tz: string = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

