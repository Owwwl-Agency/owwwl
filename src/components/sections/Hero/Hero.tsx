"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { heroFirstCardSettled, heroGridReady } from "@/lib/heroSignals";
import { DURATION, EASE, FULL_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/constants/animation";
import { HERO_CARDS, HERO_DESIGN_CARD_WIDTH, HERO_GRID_CARDS } from "@/data/hero";
import { HeroCard } from "./HeroCard/HeroCard";
import { createGridInteractions } from "./gridInteractions";
import styles from "./Hero.module.scss";

// Each card is stacked right above the title line with the same index,
// so card N covers lines 0..N (line z-index 1,3,5 / card z-index 2,4,6).
const TITLE_LINES: ReactNode[] = [
  "From Name",
  <>
    To Launch. <em className={styles.accent}>One Team.</em>
  </>,
  "One Flow.",
];

const TOP_LAYER = HERO_CARDS.length * 2;
/** Opacity of a grid card image under the pointer. */
const HOVER_OPACITY = 0.5;
/** Gap between grid cards in the design, kept as free space around the grid when panning. */
const DESIGN_GAP = 40;

// Timeline durations are expressed in viewport heights of scroll distance.
const SCROLL = {
  /** Scroll needed for a card to travel from the bottom edge of the screen to its place. */
  enter: 0.8,
  /** Scroll during which the settled card stays still before the next one starts. */
  hold: 0.2,
  ease: "power2.out",
  /** Scroll needed for the stacked cards to spread out into the grid. */
  spread: 1.2,
  /** Scroll during which the finished grid stays pinned. */
  spreadHold: 0.3,
  spreadEase: "power2.inOut",
  /** Seconds the animation takes to catch up with the scroll position. */
  scrub: 0.8,
} as const;

const SCROLL_LENGTH =
  HERO_CARDS.length * (SCROLL.enter + SCROLL.hold) + SCROLL.spread + SCROLL.spreadHold;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const gridProbe = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(FULL_MOTION_QUERY, () => {
        gsap.set(title.current, { autoAlpha: 1 });
        gsap.from(`.${styles.lineInner}`, {
          yPercent: 110,
          duration: DURATION.reveal,
          ease: EASE.outExpo,
          stagger: 0.12,
          delay: 0.15,
        });
      });

      mm.add({ full: FULL_MOTION_QUERY, reduce: REDUCED_MOTION_QUERY }, (context) => {
        const reduce = Boolean(context.conditions?.reduce);
        const cards = gsap.utils.toArray<HTMLElement>('[data-hero-card="sequence"]', root.current);
        const gridCards = gsap.utils.toArray<HTMLElement>('[data-hero-card="grid"]', root.current);
        const centerCard = cards[cards.length - 1];

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${window.innerHeight * SCROLL_LENGTH}`,
            // Pin an inner node: the pin-spacer must not wrap the element React mounts/unmounts.
            pin: stage.current,
            scrub: reduce ? true : SCROLL.scrub,
            invalidateOnRefresh: true,
          },
        });

        cards.forEach((card, index) => {
          const image = card.querySelector<HTMLElement>("[data-hero-card-image]");
          const media = image?.parentElement;
          const caption = card.querySelector("[data-hero-card-caption]");
          const prevCaption = cards[index - 1]?.querySelector("[data-hero-card-caption]");
          const step = `card-${index}`;

          tl.addLabel(step)
            .fromTo(
              card,
              // Start with the image top right at the bottom edge so it shows up on the first scroll.
              { y: () => window.innerHeight / 2 + (media?.offsetHeight ?? 0) / 2 },
              { y: 0, duration: SCROLL.enter, ease: SCROLL.ease },
              step,
            )
            .fromTo(
              image,
              { scale: reduce ? 1 : 1.3 },
              { scale: 1, duration: SCROLL.enter, ease: SCROLL.ease },
              step,
            )
            .fromTo(
              caption,
              { autoAlpha: 0, y: 16 },
              { autoAlpha: 1, y: 0, duration: SCROLL.enter * 0.3, ease: EASE.outQuart },
              `${step}+=${SCROLL.enter * 0.7}`,
            );

          if (prevCaption) {
            tl.to(
              prevCaption,
              { autoAlpha: 0, y: -12, duration: SCROLL.enter * 0.25 },
              `${step}+=${SCROLL.enter * 0.4}`,
            );
          }

          tl.to({}, { duration: SCROLL.hold });
        });

        // On short screens cards are shrunk to fit the height; the opened grid scales back up
        // to the width-based size so it keeps the design composition.
        const gridScale = () => Math.max(1, gridProbe.current!.offsetWidth / centerCard.offsetWidth);
        // Grid offsets are in design px; scale them by the card width in the opened grid.
        const unit = () => (centerCard.offsetWidth * gridScale()) / HERO_DESIGN_CARD_WIDTH;
        const gridX = (_: number, el: HTMLElement) => Number(el.dataset.gridX) * unit();
        const gridY = (_: number, el: HTMLElement) => Number(el.dataset.gridY) * unit();
        const spreading = [...cards.slice(0, -1), ...gridCards];
        const centerCaption = centerCard.querySelector("[data-hero-card-caption]");
        const captions = [...cards, ...gridCards].flatMap(
          (card) => card.querySelector("[data-hero-card-caption]") ?? [],
        );

        gsap.set(
          gridCards.map((card) => card.querySelector("[data-hero-card-caption]")),
          { autoAlpha: 0 },
        );

        tl.addLabel("spread")
          // Everything is hidden behind the center card at this point, so these swaps are invisible.
          .set(gridCards, { autoAlpha: 1 }, "spread")
          .set(cards.slice(0, -1), { zIndex: TOP_LAYER }, "spread")
          .to(
            title.current,
            { autoAlpha: 0, duration: SCROLL.spread * 0.35, ease: "power1.out" },
            "spread",
          )
          .to(
            spreading,
            { x: gridX, y: gridY, duration: SCROLL.spread, ease: SCROLL.spreadEase },
            "spread",
          )
          .fromTo(
            gridCards,
            { scale: reduce ? 1 : 0.8 },
            { scale: gridScale, duration: SCROLL.spread, ease: SCROLL.spreadEase },
            "spread",
          )
          .to(cards, { scale: gridScale, duration: SCROLL.spread, ease: SCROLL.spreadEase }, "spread")
          // Captions keep their size while the cards scale up.
          .to(
            captions,
            { scale: () => 1 / gridScale(), duration: SCROLL.spread, ease: SCROLL.spreadEase },
            "spread",
          )
          // Hide the caption while cards slide past it, bring it back once the grid has opened.
          .to(centerCaption, { autoAlpha: 0, duration: SCROLL.spread * 0.15 }, "spread")
          .to(
            centerCaption,
            { autoAlpha: 1, duration: SCROLL.spread * 0.25, ease: EASE.outQuart },
            `spread+=${SCROLL.spread * 0.75}`,
          )
          .addLabel("gridReady")
          .to({}, { duration: SCROLL.spreadHold });

        gsap.set(cards, { autoAlpha: 1 });

        const allCards = [...spreading, centerCard];
        const interactions = createGridInteractions({
          stage: stage.current!,
          cards: allCards,
          center: centerCard,
          topLayer: TOP_LAYER,
          hoverOpacity: HOVER_OPACITY,
          panEnabled: !reduce,
          getScale: gridScale,
          getPadding: () => DESIGN_GAP * unit(),
          getBounds: () => {
            const scale = gridScale();
            return allCards.reduce(
              (bounds, card) => {
                const mediaHeight = card.querySelector<HTMLElement>("[data-hero-card-media]")!.offsetHeight;
                const x = Number(card.dataset.gridX) * unit();
                const top = Number(card.dataset.gridY) * unit() - (mediaHeight * scale) / 2;
                return {
                  left: Math.min(bounds.left, x - (card.offsetWidth * scale) / 2),
                  right: Math.max(bounds.right, x + (card.offsetWidth * scale) / 2),
                  top: Math.min(bounds.top, top),
                  // The caption is counter-scaled, so only the image grows.
                  bottom: Math.max(bounds.bottom, top + mediaHeight * scale + card.offsetHeight - mediaHeight),
                };
              },
              { left: 0, right: 0, top: 0, bottom: 0 },
            );
          },
        });

        // Times are checked against the scrubbed playhead, so they follow what is on screen.
        const firstCardSettledTime = SCROLL.enter * 0.9;
        const gridReadyTime = tl.labels.gridReady;
        tl.eventCallback("onUpdate", () => {
          heroFirstCardSettled.set(tl.time() >= firstCardSettledTime);
          const gridReady = tl.time() >= gridReadyTime - 0.001;
          heroGridReady.set(gridReady);
          if (gridReady) interactions.enter();
          else interactions.exit();
        });

        return () => {
          interactions.destroy();
          heroFirstCardSettled.set(false);
          heroGridReady.set(false);
        };
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className={styles.hero} data-footer-gate>
      <div ref={stage} className={styles.stage}>
        <div ref={gridProbe} className={styles.gridProbe} aria-hidden />
        <h1 ref={title} className={styles.title}>
          {TITLE_LINES.map((line, index) => (
            <span
              key={index}
              className={styles.line}
              style={{ "--layer": index * 2 + 1 } as CSSProperties}
            >
              <span className={styles.lineInner}>{line}</span>
            </span>
          ))}
        </h1>

        {/* Rendered before the sequence cards so the center card stays on top at the same z-index. */}
        {HERO_GRID_CARDS.map((card) => (
          <HeroCard key={card.id} card={card} layer={TOP_LAYER} kind="grid" />
        ))}

        {HERO_CARDS.map((card, index) => (
          <HeroCard key={card.id} card={card} layer={index * 2 + 2} kind="sequence" />
        ))}
      </div>
    </section>
  );
}
