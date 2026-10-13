import { asset } from "@/lib/asset";

export type HeroCard = {
  id: string;
  image: string;
  alt: string;
  caption?: string[];
  /** Width / height. Defaults to the standard card ratio (305 / 410). */
  ratio?: number;
  /** Final grid position: offset of the card center from the stage center, in design px. */
  grid: { x: number; y: number };
};

/** Card width in the 1440px design; grid offsets are scaled by the rendered card width relative to it. */
export const HERO_DESIGN_CARD_WIDTH = 305;

const CAPTION = ["From a single name to a full-scale launch.", "One team. One rhythm. One outcome."];

/** Cards that slide in one by one over the title. The last one stays in the center of the grid. */
export const HERO_CARDS: HeroCard[] = [
  {
    id: "interior",
    image: asset("/images/hero/card-interior.webp"),
    alt: "Bright minimalist interior with a sofa, chair and a city view",
    caption: CAPTION,
    grid: { x: -345, y: 164 },
  },
  {
    id: "fashion",
    image: asset("/images/hero/card-fashion.webp"),
    alt: "Model in a flowing coral floral dress",
    caption: CAPTION,
    grid: { x: 345, y: -70 },
  },
  {
    id: "surf",
    image: asset("/images/hero/card-surf.webp"),
    alt: "Surfer riding inside a breaking wave",
    caption: CAPTION,
    grid: { x: 0, y: 0 },
  },
];

/** Cards hidden behind the center card that spread out into the grid. */
export const HERO_GRID_CARDS: HeroCard[] = [
  {
    id: "hands",
    image: asset("/images/hero/grid-hands.webp"),
    alt: "Two hands holding each other against a blue sky",
    caption: CAPTION,
    ratio: 1,
    grid: { x: -345, y: -233.5 },
  },
  {
    id: "marshall",
    image: asset("/images/hero/grid-marshall.webp"),
    alt: "Person carrying a red bag with a Marshall speaker",
    caption: CAPTION,
    grid: { x: -690, y: -67 },
  },
  {
    id: "canyon",
    image: asset("/images/hero/grid-canyon.webp"),
    alt: "Hiker in front of sunlit canyon cliffs",
    caption: CAPTION,
    grid: { x: -690, y: 383 },
  },
  {
    id: "bridge",
    image: asset("/images/hero/grid-bridge.webp"),
    alt: "Highway bridge pillars in the fog",
    caption: CAPTION,
    grid: { x: 345, y: 380 },
  },
  {
    id: "dancer",
    image: asset("/images/hero/grid-dancer.webp"),
    alt: "Dancer in motion on a dark stage",
    caption: CAPTION,
    grid: { x: 690, y: 138 },
  },
];
