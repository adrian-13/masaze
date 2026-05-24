import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingServices = await prisma.service.count();
  if (existingServices === 0) {
    await prisma.service.createMany({
      data: [
        {
          name: "Klasická masáž chrbta a šije",
          description:
            "Uvoľnenie napätia v oblasti chrbta, šije a ramien. Ideálna pri sedavom zamestnaní.",
          durationMin: 30,
          priceEur: 25,
          sortOrder: 1,
        },
        {
          name: "Relaxačná masáž celého tela",
          description:
            "Jemná celotelová masáž zameraná na hlboké uvoľnenie a regeneráciu.",
          durationMin: 60,
          priceEur: 45,
          sortOrder: 2,
        },
        {
          name: "Športová masáž",
          description:
            "Intenzívnejšia masáž pre aktívnych. Pomáha pri regenerácii svalov.",
          durationMin: 60,
          priceEur: 50,
          sortOrder: 3,
        },
        {
          name: "Masáž nôh a reflexná masáž chodidiel",
          description: "Príjemné uvoľnenie unavených nôh a stimulácia reflexných bodov.",
          durationMin: 45,
          priceEur: 35,
          sortOrder: 4,
        },
      ],
    });
  }

  const existingAvailability = await prisma.availability.count();
  if (existingAvailability === 0) {
    // Monday–Friday, 09:00–17:00.
    await prisma.availability.createMany({
      data: [1, 2, 3, 4, 5].map((weekday) => ({
        weekday,
        startTime: "09:00",
        endTime: "17:00",
      })),
    });
  }

  console.log("Seed dokončený.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
