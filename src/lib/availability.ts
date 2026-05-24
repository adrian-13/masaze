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

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// Computes the bookable start times for a given date + service. Pure with
// respect to its inputs apart from the DB reads it performs.
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
  const busy: Interval[] = existing.map((b) => ({
    start: toMinutes(b.startTime) - rules.bufferMin,
    end: toMinutes(b.endTime) + rules.bufferMin,
  }));

  // Earliest allowed start (lead time only matters for today).
  const earliestStart =
    dateISO === today ? nowMinutesInTZ() + rules.leadTimeHours * 60 : -Infinity;

  const slots: string[] = [];
  for (const window of windows) {
    const winStart = toMinutes(window.startTime);
    const winEnd = toMinutes(window.endTime);
    for (
      let start = winStart;
      start + durationMin <= winEnd;
      start += rules.slotIntervalMin
    ) {
      if (start < earliestStart) continue;
      const end = start + durationMin;
      const conflict = busy.some((b) => overlaps(start, end, b.start, b.end));
      if (!conflict) slots.push(toHHMM(start));
    }
  }

  const unique = Array.from(new Set(slots)).sort();
  if (unique.length === 0) return { slots: [], reason: "full" };
  return { slots: unique };
}
