import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingInputSchema } from "@/lib/validation";
import { getAvailableSlots } from "@/lib/availability";
import { toHHMM, toMinutes } from "@/lib/time";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatná požiadavka." }, { status: 400 });
  }

  const parsed = bookingInputSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Neplatné údaje.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const data = parsed.data;

  // Honeypot: silently accept bots without storing anything.
  if (data.company && data.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, active: true },
  });
  if (!service) {
    return NextResponse.json({ error: "Vybraná služba už nie je dostupná." }, { status: 400 });
  }

  // Re-validate the slot on the server to prevent stale or manipulated requests.
  const { slots } = await getAvailableSlots(data.date, service.durationMin);
  if (!slots.includes(data.startTime)) {
    return NextResponse.json(
      { error: "Tento termín už nie je voľný. Vyberte si, prosím, iný." },
      { status: 409 },
    );
  }

  const endTime = toHHMM(toMinutes(data.startTime) + service.durationMin);

  await prisma.booking.create({
    data: {
      serviceId: service.id,
      serviceName: service.name,
      date: data.date,
      startTime: data.startTime,
      endTime,
      durationMin: service.durationMin,
      priceEur: service.priceEur,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      note: data.note?.trim() ? data.note.trim() : null,
      status: "pending",
    },
  });

  return NextResponse.json({
    ok: true,
    booking: {
      serviceName: service.name,
      date: data.date,
      startTime: data.startTime,
      endTime,
    },
  });
}
