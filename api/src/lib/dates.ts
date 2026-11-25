export const TIME_ZONE = 'America/Santiago';

/** Fecha calendario (YYYY-MM-DD) en la zona horaria del casino. */
export function localDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(now);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Lunes a viernes de la semana en curso; en fin de semana, de la semana siguiente. */
export function workWeek(today: string): string[] {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 = domingo
  const toMonday = weekday === 0 ? 1 : weekday === 6 ? 2 : 1 - weekday;
  const monday = addDays(today, toMonday);
  return [0, 1, 2, 3, 4].map((i) => addDays(monday, i));
}

/** Hora local (HH:mm) del casino para un instante. */
export function localTime(at: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).format(at);
}

/** Valor que representa una columna `@db.Date`. */
export function dateColumn(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function offsetMs(at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** Instante UTC que corresponde a una hora local (HH:mm) del casino. */
export function atLocalTime(isoDate: string, time: string): Date {
  const guess = new Date(`${isoDate}T${time}:00Z`);
  const first = new Date(guess.getTime() - offsetMs(guess));
  return new Date(guess.getTime() - offsetMs(first));
}
