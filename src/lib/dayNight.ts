/** The scene is day from 7:00 am to 6:59 pm and night from 7:00 pm to 6:59 am, on the visitor's own clock. */
export const DAY_STARTS = 7, NIGHT_STARTS = 19;
export function isNightNow(now: Date = new Date()): boolean { const h = now.getHours(); return h < DAY_STARTS || h >= NIGHT_STARTS; }
/** Milliseconds until the next 7 am or 7 pm switch. */
export function msUntilSwitch(now: Date = new Date()): number {
  const next = new Date(now); const h = now.getHours();
  if (h < DAY_STARTS) next.setHours(DAY_STARTS, 0, 0, 0); else if (h < NIGHT_STARTS) next.setHours(NIGHT_STARTS, 0, 0, 0); else { next.setDate(next.getDate() + 1); next.setHours(DAY_STARTS, 0, 0, 0); }
  return Math.max(1000, next.getTime() - now.getTime() + 500);
}
