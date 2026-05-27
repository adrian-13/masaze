import { NextResponse } from "next/server";
import { getMonthAvailability } from "@/lib/availability";

// Returns the bookable days of a month for a service, so the booking calendar
// can highlight available dates. GET /api/availability?serviceId=&year=&month=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId") ?? "";
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (!serviceId) {
    return NextResponse.json({ error: "Chýba služba." }, { status: 400 });
  }
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Neplatný mesiac." }, { status: 400 });
  }

  const result = await getMonthAvailability(serviceId, year, month);
  return NextResponse.json(result);
}
