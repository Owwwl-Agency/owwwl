"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { gsap, useGSAP } from "@/lib/gsap";
import { heroGridReady } from "@/lib/heroSignals";
import { openProjectDialog } from "@/lib/projectDialog";
import { scrollToTop } from "@/lib/smoothScroll";
import { FULL_MOTION_QUERY } from "@/constants/animation";
import { FOOTER_COPYRIGHT_OWNER, FOOTER_EMAIL, FOOTER_SOCIALS } from "@/data/footer";
import { createFooterOverlay } from "./footerOverlay";
import styles from "./Footer.module.scss";

type FooterProps = {
  year: ReactNode;
};

export function Footer({ year }: FooterProps) {
  const root = useRef<HTMLElement>(null);
  const overlay = useRef<ReturnType<typeof createFooterOverlay>>(null);

  const backToTop = () => {
    overlay.current?.close();
    scrollToTop();
  };

  useGSAP(
    () => {
      gsap.matchMedia().add(FULL_MOTION_QUERY, () => {
        // Texts start as the footer settles (it slides for 1.3s), and replay on every opening.
        const reveal = gsap
          .timeline({ paused: true, delay: 0.85 })
          .set("[data-footer-reveal]", { autoAlpha: 1 })
          .from("[data-footer-reveal]", {
            yPercent: 110,
            duration: 1.4,
            ease: "power3.out",
            stagger: 0.15,
          })
          .from(
            "[data-footer-fade]",
            { y: 30, autoAlpha: 0, duration: 1.1, ease: "power2.out", stagger: 0.12 },
            0.45,
          );

        const controls = createFooterOverlay({
          footer: root.current!,
          // A page with a gated section opens the footer only after that animation has finished.
          canOpen: () => heroGridReady.get() || !document.querySelector("[data-footer-gate]"),
          onOpen: () => reveal.restart(true),
          onClosed: () => reveal.pause(0),
        });
        overlay.current = controls;

        return () => {
          controls.destroy();
          overlay.current = null;
        };
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} className={styles.footer}>
      <div className={styles.container}>
        <h2 className={styles.title}>
          <span className={styles.mask}>
            <span className={styles.maskInner} data-footer-reveal>
              Let’s Keep In Touch
            </span>
          </span>
        </h2>

        <a href={`mailto:${FOOTER_EMAIL}`} className={styles.email}>
          <span className={styles.mask}>
            <span className={styles.maskInner} data-footer-reveal>
              {FOOTER_EMAIL}
            </span>
          </span>
        </a>

        <div className={styles.cta}>
          <p className={styles.text} data-footer-fade>
            We genuinely care about you and your brand. Let us
            <br className={styles.textBreak} /> know how we can better serve you.
          </p>
          <button
            type="button"
            className={styles.project}
            data-footer-fade
            onClick={(event) => openProjectDialog({ origin: event.currentTarget })}
          >
            <Image src={asset("/images/icons/dot.svg")} alt="" width={7} height={7} unoptimized />
            <span className={styles.projectLabel}>Start Your Project</span>
          </button>
        </div>

        <button type="button" className={styles.backToTop} onClick={backToTop}>
          <span className={styles.backToTopIcon}>
            <Image src={asset("/images/icons/chevron-up.svg")} alt="" width={20} height={19} unoptimized />
          </span>
          Back To Top
        </button>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            ©{year} {FOOTER_COPYRIGHT_OWNER}
          </p>
          <ul className={styles.socials}>
            {FOOTER_SOCIALS.map((social) => (
              <li key={social.label}>
                <a href={social.href} className={styles.social} target="_blank" rel="noreferrer">
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
