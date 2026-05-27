"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, isAuthenticated, verifyPassword } from "@/lib/auth";
import {
  availabilityWindowSchema,
  blockedDateSchema,
  loginSchema,
  serviceInputSchema,
  testimonialInputSchema,
} from "@/lib/validation";
import { updateSettings, DEFAULT_SETTINGS, type Settings } from "@/lib/settings";
import { addDaysISO, isValidDateISO } from "@/lib/time";
import { sendBookingCancelled, sendBookingConfirmed } from "@/lib/mail";

export type ActionState = { ok?: boolean; error?: string } | null;

async function requireAuth() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
}

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/rezervacia");
}

// --- Authentication ---

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: "Zadajte heslo." };
  }
  if (!verifyPassword(parsed.data.password)) {
    return { error: "Nesprávne heslo." };
  }
  await createSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

// --- Services ---

export async function createService(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAuth();
  const parsed = serviceInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    durationMin: formData.get("durationMin"),
    priceEur: formData.get("priceEur"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }
  const count = await prisma.service.count();
  await prisma.service.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description?.trim() || null,
      durationMin: parsed.data.durationMin,
      priceEur: parsed.data.priceEur,
      sortOrder: count + 1,
    },
  });
  revalidatePath("/admin/sluzby");
  revalidatePublic();
  return { ok: true };
}

export async function updateService(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Chýba identifikátor." };
  const parsed = serviceInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    durationMin: formData.get("durationMin"),
    priceEur: formData.get("priceEur"),
    active: formData.get("active") === "on",
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }
  await prisma.service.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description?.trim() || null,
      durationMin: parsed.data.durationMin,
      priceEur: parsed.data.priceEur,
      active: parsed.data.active ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });
  revalidatePath("/admin/sluzby");
  revalidatePublic();
  return { ok: true };
}

export async function deleteService(formData: FormData): Promise<void> {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.service.delete({ where: { id } });
    revalidatePath("/admin/sluzby");
    revalidatePublic();
  }
}

// --- Availability ---

export async function addAvailability(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAuth();
  const parsed = availabilityWindowSchema.safeParse({
    weekday: formData.get("weekday"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }
  await prisma.availability.create({ data: parsed.data });
  revalidatePath("/admin/dostupnost");
  revalidatePublic();
  return { ok: true };
}

export async function deleteAvailability(formData: FormData): Promise<void> {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.availability.delete({ where: { id } });
    revalidatePath("/admin/dostupnost");
    revalidatePublic();
  }
}

// --- Blocked dates ---

export async function addBlockedDate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAuth();
  const parsed = blockedDateSchema.safeParse({
    date: formData.get("date"),
    reason: formData.get("reason"),
  });
  if (!parsed.success || !isValidDateISO(parsed.data.date)) {
    return { error: "Zadajte platný dátum." };
  }
  await prisma.blockedDate.upsert({
    where: { date: parsed.data.date },
    create: { date: parsed.data.date, reason: parsed.data.reason?.trim() || null },
    update: { reason: parsed.data.reason?.trim() || null },
  });
  revalidatePath("/admin/blokovane");
  revalidatePublic();
  return { ok: true };
}

export async function deleteBlockedDate(formData: FormData): Promise<void> {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.blockedDate.delete({ where: { id } });
    revalidatePath("/admin/blokovane");
    revalidatePublic();
  }
}

// Blocks every day in the [startDate, endDate] range at once (e.g. a holiday).
export async function addBlockedRange(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAuth();
  const start = String(formData.get("startDate") ?? "");
  const end = String(formData.get("endDate") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!isValidDateISO(start) || !isValidDateISO(end)) {
    return { error: "Zadajte platný začiatok a koniec." };
  }
  if (end < start) {
    return { error: "Koniec musí byť rovnaký alebo neskôr ako začiatok." };
  }

  const dates: string[] = [];
  let day = start;
  while (day <= end && dates.length < 370) {
    dates.push(day);
    day = addDaysISO(day, 1);
  }

  await prisma.$transaction(
    dates.map((date) =>
      prisma.blockedDate.upsert({
        where: { date },
        create: { date, reason },
        // Only overwrite the reason when a new one is supplied.
        update: reason ? { reason } : {},
      }),
    ),
  );
  revalidatePath("/admin/blokovane");
  revalidatePublic();
  return { ok: true };
}

// Unblocks every day in a [startDate, endDate] range (used to clear a whole
// blocked period in one click).
export async function deleteBlockedRange(formData: FormData): Promise<void> {
  await requireAuth();
  const start = String(formData.get("startDate") ?? "");
  const end = String(formData.get("endDate") ?? "");
  if (isValidDateISO(start) && isValidDateISO(end) && start <= end) {
    await prisma.blockedDate.deleteMany({ where: { date: { gte: start, lte: end } } });
    revalidatePath("/admin/blokovane");
    revalidatePublic();
  }
}

// --- Bookings ---

export async function setBookingStatus(formData: FormData): Promise<void> {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && ["pending", "confirmed", "cancelled"].includes(status)) {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return;
    // Only e-mail the customer when the status actually changes.
    const changed = booking.status !== status;
    await prisma.booking.update({ where: { id }, data: { status } });
    revalidatePath("/admin");
    if (changed && status === "confirmed") await sendBookingConfirmed(booking);
    if (changed && status === "cancelled") await sendBookingCancelled(booking);
  }
}

export async function deleteBooking(formData: FormData): Promise<void> {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.booking.delete({ where: { id } });
    revalidatePath("/admin");
  }
}

// --- Testimonials ---

export async function createTestimonial(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAuth();
  const parsed = testimonialInputSchema.safeParse({
    author: formData.get("author"),
    text: formData.get("text"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }
  const count = await prisma.testimonial.count();
  await prisma.testimonial.create({
    data: { author: parsed.data.author, text: parsed.data.text, sortOrder: count + 1 },
  });
  revalidatePath("/admin/referencie");
  revalidatePublic();
  return { ok: true };
}

export async function updateTestimonial(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Chýba identifikátor." };
  const parsed = testimonialInputSchema.safeParse({
    author: formData.get("author"),
    text: formData.get("text"),
    active: formData.get("active") === "on",
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }
  await prisma.testimonial.update({
    where: { id },
    data: {
      author: parsed.data.author,
      text: parsed.data.text,
      active: parsed.data.active ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });
  revalidatePath("/admin/referencie");
  revalidatePublic();
  return { ok: true };
}

export async function deleteTestimonial(formData: FormData): Promise<void> {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.testimonial.delete({ where: { id } });
    revalidatePath("/admin/referencie");
    revalidatePublic();
  }
}

// --- Settings ---

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAuth();
  const partial: Partial<Settings> = {};
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const value = formData.get(key);
    if (value !== null) partial[key] = String(value);
  }
  await updateSettings(partial);
  revalidatePath("/admin/nastavenia");
  revalidatePath("/");
  revalidatePath("/rezervacia");
  return { ok: true };
}
