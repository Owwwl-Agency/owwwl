import type { CSSProperties } from "react";
import Image from "next/image";
import type { HeroCard as HeroCardData } from "@/data/hero";
import styles from "./HeroCard.module.scss";

type HeroCardProps = {
  card: HeroCardData;
  layer: number;
  kind: "sequence" | "grid";
};

export function HeroCard({ card, layer, kind }: HeroCardProps) {
  const style = {
    "--layer": layer,
    ...(card.ratio && { "--card-ratio": card.ratio }),
  } as CSSProperties;

  return (
    <figure
      className={styles.card}
      style={style}
      data-hero-card={kind}
      data-grid-x={card.grid.x}
      data-grid-y={card.grid.y}
    >
      <div className={styles.inner}>
        <div className={styles.media} data-hero-card-media>
          <Image
            src={card.image}
            alt={card.alt}
            fill
            sizes="(max-width: 1040px) 220px, (max-width: 1960px) 22vw, 416px"
            loading="eager"
            className={styles.image}
            data-hero-card-image
          />
        </div>
        {card.caption && (
          <figcaption className={styles.caption} data-hero-card-caption>
            {card.caption.map((line) => (
              <span key={line} className={styles.captionLine}>
                {line}
              </span>
            ))}
          </figcaption>
        )}
      </div>
    </figure>
  );
}
