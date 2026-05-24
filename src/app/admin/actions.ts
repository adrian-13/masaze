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
} from "@/lib/validation";
import { updateSettings, DEFAULT_SETTINGS, type Settings } from "@/lib/settings";
import { isValidDateISO } from "@/lib/time";

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

// --- Bookings ---

export async function setBookingStatus(formData: FormData): Promise<void> {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && ["pending", "confirmed", "cancelled"].includes(status)) {
    await prisma.booking.update({ where: { id }, data: { status } });
    revalidatePath("/admin");
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
