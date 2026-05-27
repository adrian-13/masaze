import { prisma } from "@/lib/prisma";
import {
  bookingRulesFrom,
  getSettings,
  type BookingRules,
} from "@/lib/settings";
import {
  addDaysISO,
  isValidDateISO,
  nowMinutesInTZ,
  todayISO,
  toMinutes,
  toHHMM,
  weekdayOf,
} from "@/lib/time";

export interface SlotComputation {
  slots: string[];
  // Reason the day has no slots (for friendlier UI messages).
  reason?: "past" | "too-far" | "blocked" | "closed" | "full" | "invalid";
}

interface Interval {
  start: number;
  end: number;
}

interface Window {
  startTime: string;
  endTime: string;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// Pure slot generator: given the working windows for a day and the busy
// intervals, returns the bookable start times. Shared by the single-day and
// whole-month computations so they can never drift apart.
function generateSlots(
  windows: Window[],
  busy: Interval[],
  durationMin: number,
  slotIntervalMin: number,
  earliestStart: number,
): string[] {
  const slots: string[] = [];
  for (const window of windows) {
    const winStart = toMinutes(window.startTime);
    const winEnd = toMinutes(window.endTime);
    for (let start = winStart; start + durationMin <= winEnd; start += slotIntervalMin) {
      if (start < earliestStart) continue;
      const end = start + durationMin;
      if (!busy.some((b) => overlaps(start, end, b.start, b.end))) {
        slots.push(toHHMM(start));
      }
    }
  }
  return Array.from(new Set(slots)).sort();
}

function busyFromBookings(
  bookings: { startTime: string; endTime: string }[],
  bufferMin: number,
): Interval[] {
  return bookings.map((b) => ({
    start: toMinutes(b.startTime) - bufferMin,
    end: toMinutes(b.endTime) + bufferMin,
  }));
}

// Computes the bookable start times for a given date + service.
export async function getAvailableSlots(
  dateISO: string,
  durationMin: number,
  rulesOverride?: BookingRules,
): Promise<SlotComputation> {
  if (!isValidDateISO(dateISO) || !Number.isFinite(durationMin) || durationMin <= 0) {
    return { slots: [], reason: "invalid" };
  }

  const rules = rulesOverride ?? bookingRulesFrom(await getSettings());
  const today = todayISO();
  const maxDate = addDaysISO(today, rules.maxAdvanceDays);

  if (dateISO < today) return { slots: [], reason: "past" };
  if (dateISO > maxDate) return { slots: [], reason: "too-far" };

  const blocked = await prisma.blockedDate.findUnique({ where: { date: dateISO } });
  if (blocked) return { slots: [], reason: "blocked" };

  const weekday = weekdayOf(dateISO);
  const windows = await prisma.availability.findMany({
    where: { weekday, active: true },
    orderBy: { startTime: "asc" },
  });
  if (windows.length === 0) return { slots: [], reason: "closed" };

  const existing = await prisma.booking.findMany({
    where: { date: dateISO, status: { in: ["pending", "confirmed"] } },
    select: { startTime: true, endTime: true },
  });
  const busy = busyFromBookings(existing, rules.bufferMin);

  const earliestStart =
    dateISO === today ? nowMinutesInTZ() + rules.leadTimeHours * 60 : -Infinity;

  const slots = generateSlots(
    windows,
    busy,
    durationMin,
    rules.slotIntervalMin,
    earliestStart,
  );
  if (slots.length === 0) return { slots: [], reason: "full" };
  return { slots };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export interface MonthAvailability {
  // Dates ("YYYY-MM-DD") in the requested month that have at least one free slot.
  availableDates: string[];
}

// Computes, for a whole month, which days have at least one bookable slot for the
// given service. Fetches all needed data in a handful of queries and reuses the
// same slot logic as the single-day path.
export async function getMonthAvailability(
  serviceId: string,
  year: number,
  month: number, // 1-based
): Promise<MonthAvailability> {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return { availableDates: [] };
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, active: true },
    select: { durationMin: true },
  });
  if (!service) return { availableDates: [] };

  const rules = bookingRulesFrom(await getSettings());
  const today = todayISO();
  const maxDate = addDaysISO(today, rules.maxAdvanceDays);

  const dim = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthStart = `${year}-${pad(month)}-01`;
  const monthEnd = `${year}-${pad(month)}-${pad(dim)}`;

  const [windows, blocked, bookings] = await Promise.all([
    prisma.availability.findMany({
      where: { active: true },
      select: { weekday: true, startTime: true, endTime: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.blockedDate.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      select: { date: true },
    }),
    prisma.booking.findMany({
      where: {
        date: { gte: monthStart, lte: monthEnd },
        status: { in: ["pending", "confirmed"] },
      },
      select: { date: true, startTime: true, endTime: true },
    }),
  ]);

  const windowsByWeekday = new Map<number, Window[]>();
  for (const w of windows) {
    const list = windowsByWeekday.get(w.weekday) ?? [];
    list.push({ startTime: w.startTime, endTime: w.endTime });
    windowsByWeekday.set(w.weekday, list);
  }

  const blockedSet = new Set(blocked.map((b) => b.date));

  const bookingsByDate = new Map<string, { startTime: string; endTime: string }[]>();
  for (const b of bookings) {
    const list = bookingsByDate.get(b.date) ?? [];
    list.push({ startTime: b.startTime, endTime: b.endTime });
    bookingsByDate.set(b.date, list);
  }

  const nowMin = nowMinutesInTZ();
  const availableDates: string[] = [];

  for (let day = 1; day <= dim; day++) {
    const dateISO = `${year}-${pad(month)}-${pad(day)}`;
    if (dateISO < today || dateISO > maxDate) continue;
    if (blockedSet.has(dateISO)) continue;

    const dayWindows = windowsByWeekday.get(weekdayOf(dateISO));
    if (!dayWindows || dayWindows.length === 0) continue;

    const earliestStart =
      dateISO === today ? nowMin + rules.leadTimeHours * 60 : -Infinity;
    const busy = busyFromBookings(bookingsByDate.get(dateISO) ?? [], rules.bufferMin);
    const slots = generateSlots(
      dayWindows,
      busy,
      service.durationMin,
      rules.slotIntervalMin,
      earliestStart,
    );
    if (slots.length > 0) availableDates.push(dateISO);
  }

  return { availableDates };
}
