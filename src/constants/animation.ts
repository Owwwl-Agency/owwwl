export const EASE = {
  outExpo: "expo.out",
  outQuart: "power4.out",
  inOutQuart: "power4.inOut",
} as const;

export const DURATION = {
  fast: 0.25,
  base: 0.5,
  slow: 0.9,
  reveal: 1.2,
} as const;

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const FULL_MOTION_QUERY = "(prefers-reduced-motion: no-preference)";
