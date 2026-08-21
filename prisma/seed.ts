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

const TOPICS = [
  "3 veci, ktoré by som vedel pred prijímačkami",
  "Ako sa učiť anatómiu efektívne",
  "Deň zo života medoša",
  "Najčastejšie chyby pri príprave na prijímačky",
  "Motivácia počas skúškového",
  "Q&A: otázky sledovateľov",
  "Trik na zapamätanie si liekov",
  "Ako som sa dostal na medicínu",
  "Study with me - ranná rutina",
  "Top 5 aplikácií pre študentov",
];

function atTime(daysFromNow: number, hour: number, minute = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Seeding database...");

  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const workerPasswordHash = await bcrypt.hash("Worker123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@smm.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@smm.local",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const worker = await prisma.user.upsert({
    where: { email: "worker@smm.local" },
    update: {},
    create: {
      name: "Peter Pracovník",
      email: "worker@smm.local",
      passwordHash: workerPasswordHash,
      role: "WORKER",
    },
  });

  const worker2 = await prisma.user.upsert({
    where: { email: "worker2@smm.local" },
    update: {},
    create: {
      name: "Zuzana Zverejňovačka",
      email: "worker2@smm.local",
      passwordHash: workerPasswordHash,
      role: "WORKER",
    },
  });

  const profiles = [];
  for (const p of PROFILES) {
    const profile = await prisma.profile.upsert({
      where: { id: p.name },
      update: {},
      create: { id: p.name, ...p, notes: `Interné poznámky pre profil ${p.name}.` },
    });
    profiles.push(profile);
  }

  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", timezone: "Europe/Bratislava" },
  });

  const workers = [worker, worker2];
  let topicIndex = 0;
  const nextTopic = () => TOPICS[topicIndex++ % TOPICS.length];

  const tasksToCreate: {
    profileId: string;
    assignedUserId: string | null;
    title: string;
    topic: string;
    brief: string;
    caption: string;
    deadlineAt: Date;
    status: "PLANNED" | "TODO" | "PUBLISHED" | "OVERDUE" | "CANCELLED";
    publishedAt?: Date;
    instagramUrl?: string;
    analytics?: { views: number; reach: number; likes: number; comments: number; shares: number; saves: number };
  }[] = [];

  // Published Reels in the past (with analytics) - this month
  for (let i = 1; i <= 8; i++) {
    const profile = profiles[i % profiles.length];
    const daysAgo = -randomBetween(1, 20);
    const deadline = atTime(daysAgo, randomBetween(16, 20));
    tasksToCreate.push({
      profileId: profile.id,
      assignedUserId: workers[i % workers.length].id,
      title: nextTopic(),
      topic: "Edukatívny obsah",
      brief: "Natoč 30-60s Reel na danú tému, drž sa štýlu profilu, pridaj titulky.",
      caption: "Sleduj nás pre viac tipov zo štúdia medicíny! 📚 #medicina #studenti",
      deadlineAt: deadline,
      status: "PUBLISHED",
      publishedAt: new Date(deadline.getTime() + 30 * 60000),
      instagramUrl: `https://www.instagram.com/reel/sample${i}/`,
      analytics: {
        views: randomBetween(800, 25000),
        reach: randomBetween(600, 20000),
        likes: randomBetween(50, 1800),
        comments: randomBetween(2, 120),
        shares: randomBetween(0, 60),
        saves: randomBetween(0, 200),
      },
    });
  }

  // Overdue tasks (deadline passed, never published)
  for (let i = 1; i <= 3; i++) {
    const profile = profiles[(i + 2) % profiles.length];
    tasksToCreate.push({
      profileId: profile.id,
      assignedUserId: workers[i % workers.length].id,
      title: nextTopic(),
      topic: "Zameškaný obsah",
      brief: "Natoč a zverejni čo najskôr, deadline už uplynul.",
      caption: "",
      deadlineAt: atTime(-randomBetween(1, 5), randomBetween(9, 18)),
      status: "OVERDUE",
    });
  }

  // Today's tasks
  tasksToCreate.push({
    profileId: profiles[0].id,
    assignedUserId: worker.id,
    title: nextTopic(),
    topic: "Dnešný Reel",
    brief: "Natoč Reel na dnešnú tému. Drž sa briefu a nezabudni na CTA na konci videa.",
    caption: "Nový Reel je tu! 🎬",
    deadlineAt: atTime(0, 19, 0),
    status: "TODO",
  });
  tasksToCreate.push({
    profileId: profiles[2].id,
    assignedUserId: worker2.id,
    title: nextTopic(),
    topic: "Dnešný Reel",
    brief: "Krátke video o dennej rutine, cieľ 45 sekúnd.",
    caption: "",
    deadlineAt: atTime(0, 21, 30),
    status: "PLANNED",
  });

  // Upcoming planned tasks
  for (let i = 1; i <= 6; i++) {
    const profile = profiles[i % profiles.length];
    tasksToCreate.push({
      profileId: profile.id,
      assignedUserId: i % 3 === 0 ? null : workers[i % workers.length].id,
      title: nextTopic(),
      topic: "Naplánovaný obsah",
      brief: "Priprav Reel podľa briefu, drž sa vizuálneho štýlu profilu.",
      caption: "",
      deadlineAt: atTime(randomBetween(1, 20), randomBetween(9, 21)),
      status: "PLANNED",
    });
  }

  // A cancelled task
  tasksToCreate.push({
    profileId: profiles[1].id,
    assignedUserId: worker.id,
    title: "Zrušená spolupráca s hosťom",
    topic: "Zrušené",
    brief: "Pôvodne plánovaný Reel s hosťom, spolupráca zrušená.",
    caption: "",
    deadlineAt: atTime(-2, 18),
    status: "CANCELLED",
  });

  for (const t of tasksToCreate) {
    const task = await prisma.contentTask.create({
      data: {
        profileId: t.profileId,
        assignedUserId: t.assignedUserId,
        title: t.title,
        topic: t.topic,
        brief: t.brief,
        caption: t.caption,
        deadlineAt: t.deadlineAt,
        status: t.status,
        publishedAt: t.publishedAt,
        instagramUrl: t.instagramUrl,
        adminNotes: t.status === "PLANNED" ? "Skontrolovať kvalitu strihu pred zverejnením." : null,
      },
    });

    if (t.analytics) {
      await prisma.analytics.create({
        data: { taskId: task.id, ...t.analytics },
      });
    }
  }

  // Sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: worker.id,
        type: "TASK_ASSIGNED",
        title: "Nová úloha",
        message: "Bola ti priradená nová úloha na dnes.",
      },
      {
        userId: admin.id,
        type: "SYSTEM",
        title: "Vitaj v Social Media Manager",
        message: "Aplikácia je pripravená na použitie.",
      },
    ],
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
