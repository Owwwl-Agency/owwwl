import { gsap } from "@/lib/gsap";

type FooterOverlayOptions = {
  footer: HTMLElement;
  /** Whether the page underneath has finished its own animation. */
  canOpen: () => boolean;
  onOpen: () => void;
  onClosed: () => void;
};

const OPEN_DURATION = 1.3;
const CLOSE_DURATION = 1.1;
const EASE = "power3.inOut";
/** A longer pause between wheel events always starts a new gesture. */
const GESTURE_GAP = 200;
/** Steady mouse-wheel notches are at least this big; touchpad momentum tails are tiny. */
const NOTCH_DELTA = 20;
const SWIPE_THRESHOLD = 30;
const DOWN_KEYS = new Set(["ArrowDown", "PageDown", " ", "End"]);
const UP_KEYS = new Set(["ArrowUp", "PageUp", "Home"]);
const INTERACTIVE = "a, button, input, textarea, select, [contenteditable]";
/** Layers opened over the footer handle their own scrolling. */
const MODAL = "[data-modal]";

const inModal = (target: EventTarget | null) => target instanceof Element && target.closest(MODAL) !== null;

/**
 * The footer is a fixed layer below the screen. A new scroll gesture down at the very end of the
 * page slides it up over everything; a gesture up slides it away. While it is open (or moving)
 * the page underneath does not scroll.
 */
export function createFooterOverlay({ footer, canOpen, onOpen, onClosed }: FooterOverlayOptions) {
  let open = false;
  let tween: gsap.core.Tween | null = null;
  let lastWheel = 0;
  let lastDelta = 0;
  let touchY = 0;
  let touchHandled = false;

  gsap.set(footer, { y: 0, yPercent: 100 });

  const blocking = () => open || tween !== null;
  const atBottom = () =>
    window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 4;
  // On short screens the footer content can overflow; let it scroll natively.
  const scrollsInsideFooter = (target: EventTarget | null) =>
    target instanceof Node && footer.contains(target) && footer.scrollHeight > footer.clientHeight;

  const show = () => {
    if (open || !atBottom() || !canOpen()) return false;
    open = true;
    tween?.kill();
    gsap.set(footer, { visibility: "visible" });
    onOpen();
    tween = gsap.to(footer, {
      yPercent: 0,
      duration: OPEN_DURATION,
      ease: EASE,
      onComplete: () => {
        tween = null;
      },
    });
    return true;
  };

  const hide = () => {
    if (!open) return;
    open = false;
    tween?.kill();
    tween = gsap.to(footer, {
      yPercent: 100,
      duration: CLOSE_DURATION,
      ease: EASE,
      onComplete: () => {
        tween = null;
        gsap.set(footer, { visibility: "hidden" });
        onClosed();
      },
    });
  };

  const block = (event: Event) => {
    if (!scrollsInsideFooter(event.target) && event.cancelable) event.preventDefault();
    // Keep Lenis (listening on window, bubble phase) from scrolling the page underneath.
    event.stopPropagation();
  };

  /**
   * Touchpad momentum keeps sending wheel events with steadily shrinking deltas after the finger
   * is lifted; those must not open the footer. Anything else is the user actively scrolling:
   * a pause, a growing delta (a fresh swipe during momentum) or steady mouse-wheel notches.
   */
  const isDeliberate = (event: WheelEvent) => {
    const now = performance.now();
    const delta = Math.abs(event.deltaY);
    const deliberate =
      now - lastWheel > GESTURE_GAP ||
      Math.sign(event.deltaY) !== Math.sign(lastDelta) ||
      delta > Math.abs(lastDelta) ||
      (delta === Math.abs(lastDelta) && delta >= NOTCH_DELTA);
    lastWheel = now;
    lastDelta = event.deltaY;
    return deliberate;
  };

  const onWheel = (event: WheelEvent) => {
    if (inModal(event.target)) return;
    const deliberate = isDeliberate(event);

    if (!blocking()) {
      if (!(event.deltaY > 0 && deliberate && show())) return;
    } else if (event.deltaY < 0 && footer.scrollTop <= 0) {
      hide();
    }
    block(event);
  };

  const onTouchStart = (event: TouchEvent) => {
    touchY = event.touches[0].clientY;
    touchHandled = false;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (inModal(event.target)) return;
    const delta = touchY - event.touches[0].clientY;

    if (!touchHandled && delta > SWIPE_THRESHOLD && show()) touchHandled = true;
    else if (!touchHandled && delta < -SWIPE_THRESHOLD && open && footer.scrollTop <= 0) {
      hide();
      touchHandled = true;
    }
    if (blocking()) block(event);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (inModal(event.target)) return;
    if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return;
    const down = DOWN_KEYS.has(event.key);
    const up = UP_KEYS.has(event.key);
    if (!down && !up) return;

    if (!blocking()) {
      if (!(down && show())) return;
    } else if (up) {
      hide();
    }
    event.preventDefault();
  };

  const options = { capture: true, passive: false };
  window.addEventListener("wheel", onWheel, options);
  window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
  window.addEventListener("touchmove", onTouchMove, options);
  window.addEventListener("keydown", onKeyDown, { capture: true });

  return {
    close: hide,
    destroy() {
      tween?.kill();
      window.removeEventListener("wheel", onWheel, options);
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, options);
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      gsap.set(footer, { clearProps: "transform,visibility" });
    },
  };
}
