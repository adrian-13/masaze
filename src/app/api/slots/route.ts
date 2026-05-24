import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? "";
  const serviceId = searchParams.get("serviceId") ?? "";

  if (!serviceId) {
    return NextResponse.json({ error: "Chýba služba." }, { status: 400 });
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, active: true },
    select: { durationMin: true },
  });
  if (!service) {
    return NextResponse.json({ error: "Služba neexistuje." }, { status: 404 });
  }

  const result = await getAvailableSlots(date, service.durationMin);
  return NextResponse.json(result);
}
