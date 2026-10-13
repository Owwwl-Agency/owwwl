import type Lenis from "lenis";

let lenis: Lenis | null = null;

// Sine keeps the peak speed low (~1.6x the average), so the scroll-driven animations replay calmly.
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** Registered by SmoothScrollProvider; stays null when reduced motion disables Lenis. */
export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

/** ~1.3s per screen of distance, so the hero animations play back slowly. */
export function scrollToTop() {
  if (!lenis) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const screens = window.scrollY / window.innerHeight;
  lenis.scrollTo(0, {
    duration: Math.min(Math.max(screens * 1.3, 2), 8),
    easing: easeInOutSine,
    lock: true,
    force: true,
  });
}
