export const SLOT_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19] as const;

export const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type CalendarMonth = { year: number; month: number };

export const toMonth = (date: Date): CalendarMonth => ({
  year: date.getFullYear(),
  month: date.getMonth(),
});

export const shiftMonth = ({ year, month }: CalendarMonth, by: number): CalendarMonth =>
  toMonth(new Date(year, month + by, 1));

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** The days of a month, led by empty cells so the 1st falls on its weekday (weeks start on Monday). */
export function getMonthDays({ year, month }: CalendarMonth): (Date | null)[] {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  return [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: count }, (_, index) => new Date(year, month, index + 1)),
  ];
}

const hash = (value: number) => {
  let x = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return (x ^ (x >>> 16)) >>> 0;
};

const dayKey = (date: Date) => date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

// TODO: replace this stable mock availability with the booking backend.
export function getAvailableHours(date: Date, now: Date): number[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date < today) return [];

  const key = dayKey(date);
  if (hash(key) % 5 === 0) return [];

  return SLOT_HOURS.filter(
    (hour) => hash(key * 100 + hour) % 3 !== 0 && (!isSameDay(date, now) || hour > now.getHours()),
  );
}

export const formatMonth = ({ year, month }: CalendarMonth) => `${MONTHS[month]} ${year}`;

export const formatDate = (date: Date) =>
  `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

export const formatDay = (date: Date) => String(date.getDate()).padStart(2, "0");

export const formatHour = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

export const formatMeetingTime = (hour: number) => `${formatHour(hour)} ${hour < 12 ? "am" : "pm"}`;
