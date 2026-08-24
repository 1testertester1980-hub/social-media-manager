import "server-only";
import { prisma } from "@/lib/prisma";
import { zonedTimeToUtc, tzDayKey } from "@/lib/utils";

export function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}

const POINTS_PER_PUBLISHED = 3;
const POINTS_PER_OVERDUE = 3;

/**
 * Worker score: bonusPoints (a manually set starting balance, set by an
 * admin) + 3 per published Reel - 3 per Reel that missed its deadline, plus
 * the sum of APPROVED adjustment entries (admin penalties, always
 * pre-approved; worker bonus requests only count once an admin approves
 * them). The task-derived part is computed live from current status (not a
 * stored counter), so it self-corrects if an admin later publishes an
 * overdue task.
 */
export async function getUserPoints(userId: string) {
  const [user, published, overdue, adjustments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { bonusPoints: true } }),
    prisma.contentTask.count({ where: { assignedUserId: userId, status: "PUBLISHED" } }),
    prisma.contentTask.count({ where: { assignedUserId: userId, status: "OVERDUE" } }),
    prisma.pointsAdjustment.findMany({
      where: { userId, category: "GENERAL" },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const bonusPoints = user?.bonusPoints ?? 0;
  const approved = adjustments.filter((a) => a.status === "APPROVED");
  const adjustmentTotal = approved.reduce((sum, a) => sum + a.amount, 0);
  return {
    points: bonusPoints + published * POINTS_PER_PUBLISHED - overdue * POINTS_PER_OVERDUE + adjustmentTotal,
    bonusPoints,
    published,
    overdue,
    adjustments,
    adjustmentTotal,
  };
}

/** Points for every worker, for admin-facing lists. */
export async function getAllWorkerPoints() {
  const workers = await prisma.user.findMany({ where: { role: "WORKER" }, select: { id: true } });
  const entries = await Promise.all(
    workers.map(async (w) => [w.id, await getUserPoints(w.id)] as const)
  );
  return new Map(entries);
}

function todayRangeBratislava() {
  const [year, month, day] = tzDayKey(new Date()).split("-").map(Number);
  const start = zonedTimeToUtc(year, month, day, 0, 0);
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

/** The worker's own extra-effort bonus request for today, if they already submitted one. */
export async function getTodaysBonusRequest(userId: string) {
  const { start, end } = todayRangeBratislava();
  return prisma.pointsAdjustment.findFirst({
    where: { userId, requestedByWorker: true, category: "GENERAL", createdAt: { gte: start, lt: end } },
    orderBy: { createdAt: "desc" },
  });
}

/** All pending general (extra-effort) worker bonus requests, for the admin dashboard. */
export async function getPendingBonusRequests() {
  return prisma.pointsAdjustment.findMany({
    where: { requestedByWorker: true, status: "PENDING", category: "GENERAL" },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Pupio quality score: sum of APPROVED PUPIO_QUALITY adjustments, using the
 * admin's own decidedAmount (not the worker's requested amount). Entirely
 * separate from the general score above.
 */
export async function getUserQualityPoints(userId: string) {
  const adjustments = await prisma.pointsAdjustment.findMany({
    where: { userId, category: "PUPIO_QUALITY" },
    include: { task: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
  const approved = adjustments.filter((a) => a.status === "APPROVED");
  const points = approved.reduce((sum, a) => sum + (a.decidedAmount ?? a.amount), 0);
  return { points, adjustments };
}

/** Pupio quality points for every worker, for admin-facing lists. */
export async function getAllWorkerQualityPoints() {
  const workers = await prisma.user.findMany({ where: { role: "WORKER" }, select: { id: true } });
  const entries = await Promise.all(
    workers.map(async (w) => [w.id, await getUserQualityPoints(w.id)] as const)
  );
  return new Map(entries);
}

/** All pending Pupio quality requests, for the admin dashboard. */
export async function getPendingQualityRequests() {
  return prisma.pointsAdjustment.findMany({
    where: { requestedByWorker: true, status: "PENDING", category: "PUPIO_QUALITY" },
    include: {
      user: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getDashboardData() {
  const now = new Date();
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);

  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  const overdueStatsResetAt = settings?.overdueStatsResetAt ?? null;

  const [tasksThisMonth, todayTasks, overdueTasks, profiles] = await Promise.all([
    prisma.contentTask.findMany({
      where: { deadlineAt: { gte: start, lt: end } },
      include: { analytics: true, profile: true, assignedUser: true },
    }),
    prisma.contentTask.findMany({
      where: {
        deadlineAt: { gte: new Date(now.toDateString()), lt: new Date(new Date(now.toDateString()).getTime() + 86400000) },
        status: { notIn: ["CANCELLED"] },
      },
      include: { profile: true, assignedUser: true },
      orderBy: { deadlineAt: "asc" },
    }),
    prisma.contentTask.findMany({
      where: {
        status: "OVERDUE",
        ...(overdueStatsResetAt ? { deadlineAt: { gte: overdueStatsResetAt } } : {}),
      },
      include: { profile: true, assignedUser: true },
      orderBy: { deadlineAt: "asc" },
      take: 10,
    }),
    prisma.profile.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const planned = tasksThisMonth.length;
  const published = tasksThisMonth.filter((t) => t.status === "PUBLISHED").length;
  const overdue = tasksThisMonth.filter(
    (t) => t.status === "OVERDUE" && (!overdueStatsResetAt || t.deadlineAt >= overdueStatsResetAt)
  ).length;
  const completionRate = planned > 0 ? (published / planned) * 100 : 0;

  const totals = tasksThisMonth.reduce(
    (acc, t) => {
      acc.views += t.analytics?.views ?? 0;
      acc.reach += t.analytics?.reach ?? 0;
      acc.likes += t.analytics?.likes ?? 0;
      acc.comments += t.analytics?.comments ?? 0;
      return acc;
    },
    { views: 0, reach: 0, likes: 0, comments: 0 }
  );

  const profilePerformance = profiles.map((profile) => {
    const tasks = tasksThisMonth.filter((t) => t.profileId === profile.id);
    const pub = tasks.filter((t) => t.status === "PUBLISHED").length;
    const views = tasks.reduce((s, t) => s + (t.analytics?.views ?? 0), 0);
    return { profile, planned: tasks.length, published: pub, views };
  });

  return {
    kpis: { planned, published, overdue, completionRate, ...totals },
    todayTasks,
    overdueTasks,
    profilePerformance,
    overdueStatsResetAt,
  };
}

export async function getAnalyticsData(params: { year: number; month: number; profileId?: string }) {
  const { start, end } = monthRange(params.year, params.month);

  const tasks = await prisma.contentTask.findMany({
    where: {
      deadlineAt: { gte: start, lt: end },
      ...(params.profileId ? { profileId: params.profileId } : {}),
    },
    include: { analytics: true, profile: true, assignedUser: true },
    orderBy: { deadlineAt: "asc" },
  });

  const profiles = await prisma.profile.findMany({ orderBy: { name: "asc" } });

  const planned = tasks.length;
  const published = tasks.filter((t) => t.status === "PUBLISHED").length;
  const overdue = tasks.filter((t) => t.status === "OVERDUE").length;
  const completionRate = planned > 0 ? (published / planned) * 100 : 0;

  const totals = tasks.reduce(
    (acc, t) => {
      acc.views += t.analytics?.views ?? 0;
      acc.reach += t.analytics?.reach ?? 0;
      acc.likes += t.analytics?.likes ?? 0;
      acc.comments += t.analytics?.comments ?? 0;
      acc.shares += t.analytics?.shares ?? 0;
      acc.saves += t.analytics?.saves ?? 0;
      return acc;
    },
    { views: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
  );

  const publishedTasks = tasks.filter((t) => t.status === "PUBLISHED");
  const avg = (key: "views" | "reach" | "likes" | "comments") =>
    publishedTasks.length > 0
      ? publishedTasks.reduce((s, t) => s + (t.analytics?.[key] ?? 0), 0) / publishedTasks.length
      : 0;

  const perProfile = profiles.map((profile) => {
    const profileTasks = tasks.filter((t) => t.profileId === profile.id);
    const pub = profileTasks.filter((t) => t.status === "PUBLISHED").length;
    const ov = profileTasks.filter((t) => t.status === "OVERDUE").length;
    const views = profileTasks.reduce((s, t) => s + (t.analytics?.views ?? 0), 0);
    const reach = profileTasks.reduce((s, t) => s + (t.analytics?.reach ?? 0), 0);
    const likes = profileTasks.reduce((s, t) => s + (t.analytics?.likes ?? 0), 0);
    return {
      profile,
      planned: profileTasks.length,
      published: pub,
      overdue: ov,
      completionRate: profileTasks.length > 0 ? (pub / profileTasks.length) * 100 : 0,
      views,
      reach,
      likes,
    };
  });

  const byDay = new Map<string, number>();
  for (const t of publishedTasks) {
    const day = (t.publishedAt ?? t.deadlineAt).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const publishedOverTime = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return {
    overall: { planned, published, overdue, completionRate, ...totals },
    averages: {
      views: avg("views"),
      reach: avg("reach"),
      likes: avg("likes"),
      comments: avg("comments"),
    },
    perProfile,
    publishedOverTime,
    profiles,
    tasks,
  };
}

export async function getProfilePerformance(profileId: string) {
  const now = new Date();
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);

  const [profile, monthTasks, latestTasks, topTasks] = await Promise.all([
    prisma.profile.findUnique({ where: { id: profileId } }),
    prisma.contentTask.findMany({
      where: { profileId, deadlineAt: { gte: start, lt: end } },
      include: { analytics: true },
    }),
    prisma.contentTask.findMany({
      where: { profileId },
      include: { analytics: true, assignedUser: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.contentTask.findMany({
      where: { profileId, status: "PUBLISHED" },
      include: { analytics: true },
      orderBy: { analytics: { views: "desc" } },
      take: 5,
    }),
  ]);

  const published = monthTasks.filter((t) => t.status === "PUBLISHED").length;
  const completionRate = monthTasks.length > 0 ? (published / monthTasks.length) * 100 : 0;
  const totals = monthTasks.reduce(
    (acc, t) => {
      acc.views += t.analytics?.views ?? 0;
      acc.reach += t.analytics?.reach ?? 0;
      acc.likes += t.analytics?.likes ?? 0;
      acc.comments += t.analytics?.comments ?? 0;
      return acc;
    },
    { views: 0, reach: 0, likes: 0, comments: 0 }
  );
  const avgViews = published > 0 ? totals.views / published : 0;

  return {
    profile,
    reelsThisMonth: monthTasks.length,
    completionRate,
    totals,
    avgViews,
    latestTasks,
    topTasks,
  };
}
