/**
 * THE STYLE VAN: single source of truth for everything printed on the vehicles
 * and reused across the site. Edit values here and the 3D livery redraws itself.
 * No image regeneration needed.
 */
export const brand = {
  wordmark: 'THE STYLE VAN',
  tagline: 'Beauty on the way',
  /** Leave empty to hide. Shown on the rear of the trailer and van. */
  phone: '',
  /** Leave empty to hide. */
  website: 'thestylevan.com',
  services: ['SALON', 'BARBER', 'NAILS', 'LASHES'] as const,
} as const;

/** Colors used by both the DOM and the 3D scene. */
export const palette = {
  ivory: '#f6ede4',
  cream: '#fbf5ee',
  blush: '#e9bfc0',
  blushDeep: '#d99aa1',
  rose: '#c9868f',
  gold: '#c39a62',
  goldBright: '#e6c48a',
  wine: '#4e2a35',
  glass: '#39434a',
  charcoal: '#1f1b1d',
} as const;

/**
 * Real world dimensions in meters (1 unit = 1 m). Kept here so proportions can
 * be corrected in one place.
 */
export const dims = {
  van: { lengthFt: 14, widthFt: 6, sqFt: 85 },
  trailer: { lengthFt: 20, widthFt: 8, sqFt: 160 },
} as const;

/**
 * Livery layout, in 0..1 coordinates of a side panel. Nudge these if text
 * needs to move on the vehicle.
 */
export const livery = {
  van: { wordmarkY: 0.2, taglineY: 0.36, iconsY: 0.56, wordmarkSize: 0.058 },
  trailer: { wordmarkY: 0.22, taglineY: 0.4, iconsY: 0.63, wordmarkSize: 0.13 },
} as const;
