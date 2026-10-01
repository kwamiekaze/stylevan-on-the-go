/**
 * Day or night in Georgia, US (Atlanta: 33.749 N, 84.388 W), from the real sunrise and sunset for today's date.
 * Uses the standard sunrise equation, so it needs no network and follows daylight saving and the seasons on its own.
 */
const RAD = Math.PI / 180;
const ATLANTA = { lat: 33.749, lon: -84.388 };

export function isNightInGeorgia(now: Date = new Date()): boolean {
  const { lat, lon } = ATLANTA;
  const lw = -lon;                                              // west longitude, positive
  const jd = now.getTime() / 86400000 + 2440587.5;              // Julian date now
  const n = Math.round(jd - 2451545.0009 - lw / 360);           // solar day number nearest to now
  const jStar = 2451545.0009 + lw / 360 + n;                    // mean solar noon
  const M = (357.5291 + 0.98560028 * (jStar - 2451545)) % 360;
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const L = (M + C + 180 + 102.9372) % 360;                     // ecliptic longitude
  const jTransit = jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * L * RAD);
  const sinDec = Math.sin(L * RAD) * Math.sin(23.4397 * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * sinDec) / (Math.cos(lat * RAD) * cosDec);
  if (cosH >= 1) return true;                                   // polar night, not a Georgia case
  if (cosH <= -1) return false;
  const halfDay = Math.acos(cosH) / RAD / 360;                  // in days
  return Math.abs(jd - jTransit) > halfDay;                     // outside sunrise to sunset means night
}
