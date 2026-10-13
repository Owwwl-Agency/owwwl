import { gsap } from "@/lib/gsap";

type Bounds = { left: number; right: number; top: number; bottom: number };

type GridInteractionsOptions = {
  /** Element that receives the --pan-x / --pan-y variables. */
  stage: HTMLElement;
  cards: HTMLElement[];
  /** Card whose caption is shown when nothing is hovered. */
  center: HTMLElement;
  topLayer: number;
  /** Opacity of the hovered card image. */
  hoverOpacity: number;
  /** Grid extents in px relative to the stage center. */
  getBounds: () => Bounds;
  /** Free space kept around the grid edges when panning, in px. */
  getPadding: () => number;
  /** Scale applied to the cards in the opened grid. */
  getScale: () => number;
  panEnabled: boolean;
};

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

export function createGridInteractions({
  stage,
  cards,
  center,
  topLayer,
  hoverOpacity,
  getBounds,
  getPadding,
  getScale,
  panEnabled,
}: GridInteractionsOptions) {
  const finePointer = window.matchMedia(FINE_POINTER_QUERY).matches;
  const parts = (card: HTMLElement) => ({
    media: card.querySelector("[data-hero-card-media]"),
    caption: card.querySelector("[data-hero-card-caption]"),
  });

  let active = false;
  let hovered: HTMLElement | null = null;
  let focusTweens: gsap.core.Tween[] = [];

  const killFocusTweens = () => {
    focusTweens.forEach((tween) => tween.kill());
    focusTweens = [];
  };

  /** `null` means nothing is hovered: all images are opaque and the center caption is shown. */
  const focus = (target: HTMLElement | null) => {
    if (!active || target === hovered) return;
    hovered = target;
    killFocusTweens();
    const captioned = target ?? center;

    focusTweens = cards.flatMap((card) => {
      const on = card === captioned;
      const { media, caption } = parts(card);
      gsap.set(card, { zIndex: on ? topLayer + 1 : topLayer });

      const tweens = [
        gsap.to(media, { opacity: card === target ? hoverOpacity : 1, duration: 0.5, ease: "power2.out" }),
      ];
      if (caption) {
        tweens.push(
          gsap.to(caption, {
            autoAlpha: on ? 1 : 0,
            // Grid rows are 40px apart, slightly less than a caption; lift it so it clears the card below.
            y: card === center ? 0 : -5,
            duration: on ? 0.5 : 0.25,
            delay: on ? 0.1 : 0,
            ease: "power2.out",
          }),
        );
      }
      return tweens;
    });
  };

  const pan = { x: 0, y: 0 };
  // The pan wrapper sits inside the scaled card, so its offset is divided back to screen px.
  const applyPan = () => {
    const scale = getScale();
    stage.style.setProperty("--pan-x", `${pan.x / scale}px`);
    stage.style.setProperty("--pan-y", `${pan.y / scale}px`);
  };
  const panX = gsap.quickTo(pan, "x", { duration: 1.4, ease: "power3.out", onUpdate: applyPan });
  const panY = gsap.quickTo(pan, "y", { duration: 1.4, ease: "power3.out", onUpdate: applyPan });

  // Pointer at an edge of the screen reveals the grid edge on that side.
  const onPointerMove = (event: PointerEvent) => {
    if (!active || !panEnabled || event.pointerType !== "mouse") return;

    const bounds = getBounds();
    const padding = getPadding();
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;
    const nx = (event.clientX / window.innerWidth) * 2 - 1;
    const ny = (event.clientY / window.innerHeight) * 2 - 1;

    const range = {
      left: Math.max(0, -bounds.left + padding - halfW),
      right: Math.max(0, bounds.right + padding - halfW),
      top: Math.max(0, -bounds.top + padding - halfH),
      bottom: Math.max(0, bounds.bottom + padding - halfH),
    };

    panX(-nx * (nx < 0 ? range.left : range.right));
    panY(-ny * (ny < 0 ? range.top : range.bottom));
  };

  const listeners: Array<[EventTarget, string, EventListener]> = [];
  const listen = (target: EventTarget, type: string, handler: EventListener) => {
    target.addEventListener(type, handler);
    listeners.push([target, type, handler]);
  };

  cards.forEach((card) => {
    if (finePointer) {
      listen(card, "pointerenter", () => focus(card));
      listen(card, "pointerleave", () => focus(null));
    } else {
      listen(card, "click", (event) => {
        event.stopPropagation();
        focus(card);
      });
    }
  });
  if (!finePointer) listen(stage, "click", () => focus(null));
  listen(window, "pointermove", onPointerMove as EventListener);

  return {
    enter() {
      if (active) return;
      active = true;
      hovered = null;
    },
    /** Leaves the interactive grid; the center caption is left to the scroll timeline. */
    exit() {
      if (!active) return;
      active = false;
      hovered = null;
      killFocusTweens();
      panX(0);
      panY(0);

      gsap.set(cards, { zIndex: topLayer });
      cards.forEach((card) => {
        const { media, caption } = parts(card);
        gsap.to(media, { opacity: 1, duration: 0.3 });
        if (card !== center && caption) gsap.to(caption, { autoAlpha: 0, duration: 0.25 });
      });
    },
    destroy() {
      killFocusTweens();
      listeners.forEach(([target, type, handler]) => target.removeEventListener(type, handler));
      stage.style.removeProperty("--pan-x");
      stage.style.removeProperty("--pan-y");
    },
  };
}
