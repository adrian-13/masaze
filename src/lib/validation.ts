import { z } from "zod";

const dateISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Neplatný dátum.");
const timeHHMM = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Neplatný čas.");

export const bookingInputSchema = z.object({
  serviceId: z.string().min(1, "Vyberte službu."),
  date: dateISO,
  startTime: timeHHMM,
  customerName: z.string().trim().min(2, "Zadajte meno.").max(120),
  customerEmail: z.string().trim().email("Neplatný e-mail.").max(160),
  customerPhone: z
    .string()
    .trim()
    .min(6, "Zadajte telefónne číslo.")
    .max(40),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  // Honeypot field: real users leave it empty.
  company: z.string().optional(),
});

export type BookingInput = z.infer<typeof bookingInputSchema>;

export const serviceInputSchema = z.object({
  name: z.string().trim().min(2, "Zadajte názov.").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  durationMin: z.coerce
    .number()
    .int()
    .min(5, "Minimálne 5 minút.")
    .max(600, "Maximálne 600 minút."),
  priceEur: z.coerce.number().min(0).max(100000),
  active: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const availabilityWindowSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: timeHHMM,
    endTime: timeHHMM,
  })
  .refine((v) => v.startTime < v.endTime, {
    message: "Koniec musí byť po začiatku.",
    path: ["endTime"],
  });

export const blockedDateSchema = z.object({
  date: dateISO,
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});

export const testimonialInputSchema = z.object({
  author: z.string().trim().min(2, "Zadajte meno.").max(80),
  text: z.string().trim().min(4, "Zadajte text ohlasu.").max(600),
  active: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const loginSchema = z.object({
  password: z.string().min(1, "Zadajte heslo."),
});
