import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  TestimonialCreateForm,
  TestimonialRow,
} from "@/components/admin/testimonial-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ohlasy" };

export default async function AdminTestimonialsPage() {
  await requireAdmin();

  let testimonials: {
    id: string;
    author: string;
    text: string;
    active: boolean;
    sortOrder: number;
  }[] = [];
  try {
    testimonials = await prisma.testimonial.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true, author: true, text: true, active: true, sortOrder: true },
    });
  } catch {
    testimonials = [];
  }

  return (
    <div>
      <h1 className="text-2xl text-bark">Ohlasy klientov</h1>
      <p className="mt-1 text-sm text-stone">
        Spravujte referencie zobrazené na úvodnej stránke. Neaktívne sa nezobrazujú.
      </p>

      <div className="mt-8 max-w-3xl space-y-5">
        <TestimonialCreateForm />
        {testimonials.map((t) => (
          <TestimonialRow key={t.id} testimonial={t} />
        ))}
      </div>
    </div>
  );
}
