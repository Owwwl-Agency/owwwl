"use client";

import { useRef } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { heroFirstCardSettled } from "@/lib/heroSignals";
import { DURATION, EASE, FULL_MOTION_QUERY } from "@/constants/animation";
import styles from "./BottomNav.module.scss";

export function BottomNav() {
  const root = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(FULL_MOTION_QUERY, () => {
        // An element, not a selector: toggles run later, outside the useGSAP scope.
        const pill = pillRef.current;
        gsap.set(pill, { autoAlpha: 0, yPercent: 60 });

        const toggle = (visible: boolean) =>
          gsap.to(
            pill,
            visible
              ? { autoAlpha: 1, yPercent: 0, duration: DURATION.slow, ease: EASE.outExpo, overwrite: true }
              : { autoAlpha: 0, yPercent: 60, duration: DURATION.base, ease: "power2.in", overwrite: true },
          );

        if (heroFirstCardSettled.get()) toggle(true);
        return heroFirstCardSettled.subscribe(toggle);
      });
    },
    { scope: root },
  );

  return (
    <nav ref={root} className={styles.nav} aria-label="Main">
      <Link ref={pillRef} href="/" className={styles.pill}>
        <span className={styles.icon}>
          <Image src={asset("/images/icons/arrow-circle.svg")} alt="" width={44} height={44} unoptimized />
        </span>
        <span className={styles.label}>Home</span>
      </Link>
    </nav>
  );
}
