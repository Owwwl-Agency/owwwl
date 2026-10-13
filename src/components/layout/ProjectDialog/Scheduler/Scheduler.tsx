"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { gsap } from "@/lib/gsap";
import { REDUCED_MOTION_QUERY } from "@/constants/animation";
import { MEETING } from "@/data/projectDialog";
import {
  SLOT_HOURS,
  WEEKDAYS,
  formatDate,
  formatDay,
  formatHour,
  formatMeetingTime,
  formatMonth,
  getAvailableHours,
  getMonthDays,
  isSameDay,
  shiftMonth,
  toMonth,
  type CalendarMonth,
} from "@/lib/schedule";
import { Field } from "../Field/Field";
import { Clock } from "./Clock";
import styles from "./Scheduler.module.scss";

export type MeetStage = "date" | "time" | "details";

const STAGES: MeetStage[] = ["date", "time", "details"];
/** How long the picked time (and the clock winding to it) stays on screen before the form. */
const ADVANCE_DELAY = 1000;
/** From this width the calendar and the hours share one screen. */
const WIDE_QUERY = "(min-width: 1024px)";
const SHIFT = 40;

function Icon({ name }: { name: "timer" | "clock" | "calendar" | "global" }) {
  return <Image src={asset(`/images/icons/${name}.svg`)} alt="" width={20} height={20} unoptimized />;
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <Image
      src={asset("/images/icons/chevron-up-dark.svg")}
      alt=""
      width={20}
      height={19}
      className={direction === "left" ? styles.chevronLeft : styles.chevronRight}
      unoptimized
    />
  );
}

type SchedulerProps = {
  /** Read when the dialog opens; the calendar stays empty until then. */
  now: Date | null;
  stage: MeetStage;
  onStageChange: (stage: MeetStage) => void;
};

export function Scheduler({ now, stage, onStageChange }: SchedulerProps) {
  const view = useRef<HTMLDivElement>(null);
  const direction = useRef(0);
  const advanceTimer = useRef<number>(undefined);
  const [month, setMonth] = useState<CalendarMonth | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [clockHour, setClockHour] = useState<number>(SLOT_HOURS[0]);
  const [guests, setGuests] = useState(false);
  const [sent, setSent] = useState(false);

  const shownMonth = month ?? (now ? toMonth(now) : null);
  const available = date && now ? getAvailableHours(date, now) : null;

  useEffect(() => {
    const timer = advanceTimer;
    return () => window.clearTimeout(timer.current);
  }, []);

  // The new view slides in from the side the old one left towards.
  useLayoutEffect(() => {
    const element = view.current;
    if (!element || !direction.current) return;
    element.closest("[data-dialog-scroller]")?.scrollTo({ top: 0 });
    gsap.fromTo(
      element,
      { x: direction.current * SHIFT, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out", overwrite: true, clearProps: "all" },
    );
    direction.current = 0;
  }, [stage]);

  const goTo = (next: MeetStage) => {
    window.clearTimeout(advanceTimer.current);
    const element = view.current;
    if (next === stage) return;

    const samePicker = next !== "details" && stage !== "details" && window.matchMedia(WIDE_QUERY).matches;
    if (!element || samePicker || window.matchMedia(REDUCED_MOTION_QUERY).matches) {
      onStageChange(next);
      return;
    }

    const forward = STAGES.indexOf(next) > STAGES.indexOf(stage) ? 1 : -1;
    gsap.to(element, {
      x: -forward * SHIFT,
      autoAlpha: 0,
      duration: 0.35,
      ease: "power2.in",
      overwrite: true,
      onComplete: () => {
        direction.current = forward;
        onStageChange(next);
      },
    });
  };

  const pickDate = (day: Date) => {
    setDate(day);
    setHour(null);
    goTo("time");
  };

  const pickHour = (slot: number) => {
    if (!available?.includes(slot)) return;
    if (slot === hour) {
      goTo("details");
      return;
    }
    setHour(slot);
    setClockHour(slot);
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => goTo("details"), ADVANCE_DELAY);
  };

  // TODO: send the booking to the backend.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  const summary =
    date && hour !== null
      ? [
          { icon: "timer", text: MEETING.duration },
          { icon: "clock", text: formatMeetingTime(hour) },
          { icon: "calendar", text: formatDate(date) },
          { icon: "global", text: MEETING.timeZone },
        ] as const
      : null;

  return (
    <div ref={view} className={styles.scheduler} data-stage={stage}>
      {stage === "details" && date && summary ? (
        <form className={styles.details} onSubmit={onSubmit}>
          <button type="button" className={styles.back} onClick={() => goTo("time")}>
            <Chevron direction="left" />
            <span className={styles.backItem}>
              <Icon name="clock" />
              {summary[1].text}
            </span>
            <span className={styles.backDivider} />
            <span className={styles.backItem}>
              <Icon name="calendar" />
              {summary[2].text}
            </span>
            <span className={styles.srOnly}>Change the time</span>
          </button>

          <div className={styles.detailsForm} data-dialog-reveal>
            <h3 className={styles.heading}>Details</h3>
            <div className={styles.fields}>
              <Field label="First Name*" name="firstName" required autoComplete="given-name" />
              <Field label="Last Name*" name="lastName" required autoComplete="family-name" />
              <Field label="Company" name="company" autoComplete="organization" />
              <Field label="Phone number" name="phone" type="tel" autoComplete="tel" />
              <Field label="Email*" name="email" type="email" required autoComplete="email" className={styles.wide} />
            </div>
            {guests ? (
              <Field label="Guest emails" name="guests" className={styles.guestsField} />
            ) : (
              <button type="button" className={styles.guests} onClick={() => setGuests(true)}>
                <b>+</b> Add Guests
              </button>
            )}
            <Field label="Describe Your Project" name="description" multiline className={styles.description} />

            <ul className={styles.card}>
              {summary.map((item) => (
                <li key={item.icon} className={styles.summaryItem}>
                  <Icon name={item.icon} />
                  {item.text}
                </li>
              ))}
            </ul>

            <button type="submit" className={styles.submit} disabled={sent}>
              {sent ? "Thank you!" : "Submit"}
            </button>
          </div>

          <div className={styles.summary} data-dialog-reveal>
            <p className={styles.heading}>{MEETING.title}</p>
            <ul className={styles.summaryList}>
              {summary.map((item) =>
                item.icon === "clock" || item.icon === "calendar" ? (
                  <li key={item.icon}>
                    <button type="button" className={styles.summaryItem} onClick={() => goTo("time")}>
                      <Icon name={item.icon} />
                      {item.text}
                    </button>
                  </li>
                ) : (
                  <li key={item.icon} className={styles.summaryItem}>
                    <Icon name={item.icon} />
                    {item.text}
                  </li>
                ),
              )}
            </ul>
            <p className={styles.thanks}>Thank you for your decision to schedule a meet</p>
          </div>
        </form>
      ) : (
        <div className={styles.picker}>
          {stage === "time" && date && (
            <button type="button" className={styles.back} onClick={() => goTo("date")}>
              <Chevron direction="left" />
              <span className={styles.backItem}>
                <Icon name="calendar" />
                {formatDate(date)}
              </span>
              <span className={styles.srOnly}>Change the date</span>
            </button>
          )}

          <div className={styles.calendar} data-dialog-reveal>
            {shownMonth && now && (
              <>
                <div className={styles.month}>
                  <button
                    type="button"
                    className={styles.monthNav}
                    aria-label="Previous month"
                    disabled={shownMonth.year === now.getFullYear() && shownMonth.month === now.getMonth()}
                    onClick={() => setMonth(shiftMonth(shownMonth, -1))}
                  >
                    <Chevron direction="left" />
                  </button>
                  <p className={styles.monthLabel} aria-live="polite">
                    {formatMonth(shownMonth)}
                  </p>
                  <button
                    type="button"
                    className={styles.monthNav}
                    aria-label="Next month"
                    onClick={() => setMonth(shiftMonth(shownMonth, 1))}
                  >
                    <Chevron direction="right" />
                  </button>
                </div>

                <div className={styles.weekdays} aria-hidden>
                  {WEEKDAYS.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>

                <ol key={formatMonth(shownMonth)} className={styles.days}>
                  {getMonthDays(shownMonth).map((day, index) =>
                    day ? (
                      <li key={index}>
                        <button
                          type="button"
                          className={styles.cell}
                          disabled={getAvailableHours(day, now).length === 0}
                          aria-pressed={date ? isSameDay(day, date) : false}
                          aria-label={formatDate(day)}
                          data-today={isSameDay(day, now) || undefined}
                          onClick={() => pickDate(day)}
                        >
                          {formatDay(day)}
                        </button>
                      </li>
                    ) : (
                      <li key={index} aria-hidden />
                    ),
                  )}
                </ol>
              </>
            )}
          </div>

          <div className={styles.time} data-dialog-reveal>
            <Clock hour={clockHour} hours={available ?? SLOT_HOURS} />
            <ul className={styles.slots}>
              {SLOT_HOURS.map((slot) => {
                const selected = slot === hour;
                return (
                  <li key={slot}>
                    <button
                      type="button"
                      className={`${styles.cell} ${styles.slot}`}
                      // Until a day is picked the hours are shown but cannot be chosen yet.
                      aria-disabled={!available || undefined}
                      disabled={available ? !available.includes(slot) : undefined}
                      aria-pressed={selected}
                      onClick={() => pickHour(slot)}
                    >
                      {selected ? "Next" : formatHour(slot)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
