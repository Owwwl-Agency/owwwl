"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { gsap } from "@/lib/gsap";
import { subscribeProjectDialog } from "@/lib/projectDialog";
import { REDUCED_MOTION_QUERY } from "@/constants/animation";
import { FOOTER_EMAIL } from "@/data/footer";
import { PRIVACY_POLICY_URL } from "@/data/projectDialog";
import { ProjectForm } from "./ProjectForm/ProjectForm";
import { Scheduler, type MeetStage } from "./Scheduler/Scheduler";
import { lockDialogScroll } from "./scrollLock";
import styles from "./ProjectDialog.module.scss";

type Tab = "project" | "meet";
type Point = { x: number; y: number };

const TABS: { id: Tab; label: string }[] = [
  { id: "project", label: "Start Your Project" },
  { id: "meet", label: "Schedule a Meet" },
];

const OPEN_DURATION = 1.3;
const CLOSE_DURATION = 0.9;
const SWITCH_DURATION = 1.2;
/** How far the tab contents travel while they swap. */
const SHIFT = 120;

const circle = (radius: number, { x, y }: Point) => `circle(${radius}px at ${x}px ${y}px)`;
// The light backdrop is anchored to the left edge and wipes across by moving its right edge.
const lightClip = (rightInset: number) => `inset(0% ${rightInset}% 0% 0%)`;
const reducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;

export function ProjectDialog() {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLDivElement>(null);
  const projectPanelRef = useRef<HTMLDivElement>(null);
  const meetPanelRef = useRef<HTMLDivElement>(null);
  const origin = useRef<Point>({ x: 0, y: 0 });
  const asideFrom = useRef<DOMRect | null>(null);
  const motion = useRef<gsap.core.Timeline | null>(null);
  const closing = useRef(false);
  const [now, setNow] = useState<Date | null>(null);
  const [tab, setTab] = useState<Tab>("project");
  const [leaving, setLeaving] = useState<Tab | null>(null);
  const [meetStage, setMeetStage] = useState<MeetStage>("date");

  const close = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog?.open || closing.current) return;

    const finish = () => {
      closing.current = false;
      dialog.close();
      gsap.set([dialog, stageRef.current], { clearProps: "clipPath,transform" });
      setTab("project");
      setLeaving(null);
      setMeetStage("date");
    };
    if (reducedMotion()) {
      finish();
      return;
    }

    closing.current = true;
    motion.current?.kill();
    motion.current = gsap
      .timeline({ onComplete: finish })
      .to(stageRef.current, { scale: 0.85, duration: CLOSE_DURATION, ease: "power3.inOut" }, 0)
      .to(dialog, { clipPath: circle(0, origin.current), duration: CLOSE_DURATION, ease: "power3.inOut" }, 0);
  }, [setTab, setLeaving, setMeetStage]);

  useEffect(() => {
    const dialog = dialogRef.current!;
    const scroller = scrollerRef.current!;
    const unlock = lockDialogScroll(dialog, scroller);
    const running = motion;

    // Escape closes through the same animation.
    const onCancel = (event: Event) => {
      event.preventDefault();
      close();
    };
    dialog.addEventListener("cancel", onCancel);

    const unsubscribe = subscribeProjectDialog(({ origin: trigger }) => {
      if (dialog.open) return;
      const rect = trigger?.getBoundingClientRect();
      const point = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      origin.current = point;
      setNow(new Date());
      dialog.showModal();
      scroller.scrollTop = 0;
      if (reducedMotion()) return;

      // The dialog grows out of the control that opened it while its contents zoom into place.
      const radius = Math.hypot(
        Math.max(point.x, window.innerWidth - point.x),
        Math.max(point.y, window.innerHeight - point.y),
      );
      const reveal = gsap.utils
        .toArray<HTMLElement>(dialog.querySelectorAll("[data-dialog-reveal]"))
        .filter((element) => element.checkVisibility());

      running.current?.kill();
      gsap.set(stageRef.current, { transformOrigin: `${point.x}px ${point.y}px` });
      running.current = gsap
        .timeline()
        .fromTo(
          dialog,
          { clipPath: circle(0, point) },
          { clipPath: circle(radius, point), duration: OPEN_DURATION, ease: "expo.inOut" },
          0,
        )
        .fromTo(
          stageRef.current,
          { scale: 0.7 },
          { scale: 1, duration: OPEN_DURATION + 0.2, ease: "expo.inOut", clearProps: "transform" },
          0,
        )
        .fromTo(
          reveal,
          { y: 40, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out", stagger: 0.07, clearProps: "transform" },
          OPEN_DURATION * 0.55,
        );
    });

    return () => {
      unsubscribe();
      unlock();
      dialog.removeEventListener("cancel", onCancel);
      running.current?.kill();
    };
  }, [close]);

  const switchTab = (next: Tab) => {
    if (next === tab || leaving) return;
    if (reducedMotion()) {
      setTab(next);
      return;
    }
    asideFrom.current = asideRef.current?.getBoundingClientRect() ?? null;
    setLeaving(tab);
    setTab(next);
  };

  // The contents swap sideways (forward: left to right), the light backdrop wipes in the same
  // direction, and the shared "Schedule Meeting" block glides across to its column for the tab.
  useLayoutEffect(() => {
    if (!leaving) return;
    const panels = { project: projectPanelRef.current, meet: meetPanelRef.current };
    const incoming = panels[tab];
    const outgoing = panels[leaving];
    const aside = asideRef.current!;
    const light = lightRef.current;
    const from = asideFrom.current;
    const to = aside.getBoundingClientRect();
    const forward = tab === "meet" ? 1 : -1;

    scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    const timeline = gsap
      .timeline({
        onComplete: () => {
          gsap.set([incoming, outgoing, aside, light], { clearProps: "transform,opacity,visibility,clipPath" });
          setLeaving(null);
        },
      })
      .to(outgoing, { x: forward * SHIFT, autoAlpha: 0, duration: 0.6, ease: "power3.in" }, 0)
      .fromTo(
        light,
        { clipPath: lightClip(forward > 0 ? 100 : 0) },
        { clipPath: lightClip(forward > 0 ? 0 : 100), duration: SWITCH_DURATION, ease: "power3.inOut" },
        0,
      )
      .fromTo(
        incoming,
        { x: -forward * SHIFT, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out" },
        0.55,
      );

    if (from?.width && to.width) {
      timeline.fromTo(
        aside,
        { x: from.left - to.left, y: from.top - to.top },
        { x: 0, y: 0, duration: SWITCH_DURATION, ease: "power3.inOut" },
        0,
      );
    }

    return () => {
      timeline.kill();
    };
  }, [leaving, tab]);

  const panelProps = (panel: Tab) => ({
    id: `${id}-${panel}`,
    role: "tabpanel",
    "aria-labelledby": `${id}-${panel}-tab`,
    hidden: tab !== panel && leaving !== panel,
    inert: leaving === panel,
  });

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      data-theme={tab === "meet" ? "light" : "dark"}
      aria-label="Contact Owwwl"
      data-modal
      data-lenis-prevent
    >
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.backdrop} aria-hidden>
          <div className={styles.dark}>
            <Image src={asset("/images/dialog/glow-dark.svg")} alt="" width={1350} height={1343} className={styles.glow} unoptimized />
          </div>
          <div ref={lightRef} className={styles.light}>
            <Image src={asset("/images/dialog/glow-light.svg")} alt="" width={1350} height={1350} className={styles.glow} unoptimized />
          </div>
        </div>

        <header className={styles.bar}>
          <div role="tablist" aria-label="Contact options" className={styles.tabs} data-dialog-reveal>
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`${id}-${item.id}-tab`}
                aria-controls={`${id}-${item.id}`}
                aria-selected={tab === item.id}
                className={styles.tab}
                onClick={() => switchTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" className={styles.close} aria-label="Close" onClick={close} data-dialog-reveal />
        </header>

        <div ref={scrollerRef} className={styles.scroller} data-dialog-scroller>
          <div className={styles.content}>
            <div className={styles.layout} data-tab={tab} data-stage={meetStage}>
              <div ref={asideRef} className={styles.aside}>
                <h2 className={styles.title} data-dialog-reveal>
                  Schedule Meeting
                </h2>
                <p className={styles.lead} data-dialog-reveal>
                  If you have issues submitting this form, please{" "}
                  <a href={`mailto:${FOOTER_EMAIL}`} className={styles.link}>
                    send a regular email
                  </a>{" "}
                  or{" "}
                  <button type="button" className={styles.link} onClick={() => switchTab("meet")}>
                    Schedule a meet
                  </button>
                  .
                </p>
              </div>

              <div ref={projectPanelRef} className={`${styles.panel} ${styles.projectPanel}`} {...panelProps("project")}>
                <ProjectForm />
              </div>
              <div ref={meetPanelRef} className={`${styles.panel} ${styles.meetPanel}`} {...panelProps("meet")}>
                <Scheduler now={now} stage={meetStage} onStageChange={setMeetStage} />
              </div>
            </div>

            <div className={styles.notice} data-dialog-reveal>
              <p className={styles.noticeText}>
                By using this form, you consent to your form data being stored on the website’s external
                servers, so that our team can access, process and contact you about your project enquiry. For
                more information about our sensitivity towards personal data, visit our{" "}
                <a href={PRIVACY_POLICY_URL} className={styles.link}>
                  privacy policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
