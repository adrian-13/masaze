import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { todayISO } from "@/lib/time";
import { formatDateLong, formatDuration, formatPrice } from "@/lib/format";
import { deleteBooking, setBookingStatus } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Objednávky" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Čaká na potvrdenie",
  confirmed: "Potvrdené",
  cancelled: "Zrušené",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sage/20 text-sage-dark",
  cancelled: "bg-stone/15 text-stone line-through",
};

type Booking = Awaited<ReturnType<typeof prisma.booking.findMany>>[number];

export default async function AdminBookingsPage() {
  await requireAdmin();
  const today = todayISO();
  const [upcoming, past] = await Promise.all([
    prisma.booking.findMany({
      where: { date: { gte: today } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.booking.findMany({
      where: { date: { lt: today } },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      take: 20,
    }),
  ]);

  const pendingCount = upcoming.filter((b) => b.status === "pending").length;
  const confirmedCount = upcoming.filter((b) => b.status === "confirmed").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl text-bark">Objednávky</h1>
          <p className="mt-1 text-sm text-stone">Prehľad rezervácií od zákazníkov.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
            {pendingCount} čaká
          </span>
          <span className="rounded-full bg-sage/20 px-3 py-1 font-medium text-sage-dark">
            {confirmedCount} potvrdených
          </span>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone">
          Nadchádzajúce
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-sand-dark/70 px-5 py-8 text-center text-stone">
            Zatiaľ žiadne nadchádzajúce rezervácie.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {upcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone">
            Staršie
          </h2>
          <div className="mt-4 space-y-3 opacity-80">
            {past.map((booking) => (
              <BookingCard key={booking.id} booking={booking} past />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BookingCard({ booking, past = false }: { booking: Booking; past?: boolean }) {
  return (
    <article className="rounded-2xl border border-sand-dark/40 bg-cream/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-bark">{booking.serviceName}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[booking.status]}`}
            >
              {STATUS_LABEL[booking.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone">
            {formatDateLong(booking.date)} · {booking.startTime}–{booking.endTime} ·{" "}
            {formatDuration(booking.durationMin)} · {formatPrice(booking.priceEur)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-1 text-sm text-bark sm:grid-cols-3">
        <span>
          <span className="text-stone">Meno: </span>
          {booking.customerName}
        </span>
        <span>
          <span className="text-stone">Tel.: </span>
          <a className="hover:text-clay" href={`tel:${booking.customerPhone.replace(/\s+/g, "")}`}>
            {booking.customerPhone}
          </a>
        </span>
        <span className="truncate">
          <span className="text-stone">E-mail: </span>
          <a className="hover:text-clay" href={`mailto:${booking.customerEmail}`}>
            {booking.customerEmail}
          </a>
        </span>
      </div>

      {booking.note && (
        <p className="mt-2 rounded-lg bg-sand/40 px-3 py-2 text-sm text-stone">
          {booking.note}
        </p>
      )}

      {!past && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-sand-dark/40 pt-4">
          {booking.status !== "confirmed" && (
            <StatusButton id={booking.id} status="confirmed" label="Potvrdiť" variant="sage" />
          )}
          {booking.status !== "cancelled" && (
            <StatusButton id={booking.id} status="cancelled" label="Zrušiť" variant="outline" />
          )}
          {booking.status !== "pending" && (
            <StatusButton id={booking.id} status="pending" label="Vrátiť na čakajúce" variant="outline" />
          )}
          <form action={deleteBooking} className="ml-auto">
            <input type="hidden" name="id" value={booking.id} />
            <button
              type="submit"
              className="rounded-full px-3 py-1.5 text-sm text-stone hover:text-red-700"
            >
              Vymazať
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function StatusButton({
  id,
  status,
  label,
  variant,
}: {
  id: string;
  status: string;
  label: string;
  variant: "sage" | "outline";
}) {
  const className =
    variant === "sage"
      ? "inline-flex items-center justify-center rounded-xl bg-sage px-4 py-2 text-sm font-semibold leading-none text-cream transition-colors hover:bg-sage-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
      : "inline-flex items-center justify-center rounded-xl border border-sand-dark/60 px-4 py-2 text-sm font-medium leading-none text-bark transition-colors hover:bg-sand focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40";
  return (
    <form action={setBookingStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
