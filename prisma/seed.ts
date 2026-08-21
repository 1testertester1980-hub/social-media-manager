import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PROFILES = [
  { name: "Mediktest", instagramUsername: "@mediktest", color: "#6366f1" },
  { name: "Mediktest CZ", instagramUsername: "@mediktest.cz", color: "#0ea5e9" },
  { name: "Chlapec na medicíne", instagramUsername: "@chlapec.na.medicine", color: "#22c55e" },
  { name: "Dievča na medicíne", instagramUsername: "@dievca.na.medicine", color: "#ec4899" },
  { name: "Studigenius", instagramUsername: "@studigenius", color: "#f97316" },
];

/**
 * Seeds only real, permanent entities: the admin/worker accounts, the 5
 * profiles, and app settings. No demo content tasks or notifications are
 * created — the daily rotation (src/lib/rotation.ts) generates real tasks
 * once the app is running.
 */
async function main() {
  console.log("Seeding database...");

  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const workerPasswordHash = await bcrypt.hash("Worker123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@smm.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@smm.local",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "worker@smm.local" },
    update: {},
    create: {
      name: "Marko Pracovník",
      email: "worker@smm.local",
      passwordHash: workerPasswordHash,
      role: "WORKER",
    },
  });

  for (const p of PROFILES) {
    await prisma.profile.upsert({
      where: { id: p.name },
      update: {},
      create: { id: p.name, ...p, notes: `Interné poznámky pre profil ${p.name}.` },
    });
  }

  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", timezone: "Europe/Bratislava" },
  });

  console.log("Seed complete.");
  console.log("Admin login: admin@smm.local / Admin123!");
  console.log("Worker login: worker@smm.local / Worker123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
