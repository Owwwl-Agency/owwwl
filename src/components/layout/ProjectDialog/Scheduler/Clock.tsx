"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { gsap } from "@/lib/gsap";
import { REDUCED_MOTION_QUERY } from "@/constants/animation";
import styles from "./Scheduler.module.scss";

const TICKS = Array.from({ length: 12 }, (_, index) => index);
const TURN_DURATION = 0.9;

type ClockProps = {
  hour: number;
  /** Bookable hours: their marks on the dial are drawn solid. */
  hours: readonly number[];
};

/** Moving to another hour winds the hands through the time in between. */
export function Clock({ hour, hours }: ClockProps) {
  const hourHand = useRef<HTMLSpanElement>(null);
  const minuteHand = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  useEffect(() => {
    const duration = placed.current && !window.matchMedia(REDUCED_MOTION_QUERY).matches ? TURN_DURATION : 0;
    placed.current = true;
    const vars = { duration, ease: "power2.inOut", overwrite: true };
    gsap.to(hourHand.current, { ...vars, rotation: hour * 30 });
    gsap.to(minuteHand.current, { ...vars, rotation: hour * 360 });
  }, [hour]);

  return (
    <div className={styles.clock} aria-hidden>
      {TICKS.map((tick) => (
        <span
          key={tick}
          className={styles.tick}
          style={{ "--tick": tick } as CSSProperties}
          data-active={hours.some((slot) => slot % 12 === tick) || undefined}
        />
      ))}
      <span ref={minuteHand} className={styles.minuteHand} />
      <span ref={hourHand} className={styles.hourHand} />
      <Image src={asset("/images/icons/clock-pin.svg")} alt="" width={6} height={6} className={styles.pin} unoptimized />
    </div>
  );
}
