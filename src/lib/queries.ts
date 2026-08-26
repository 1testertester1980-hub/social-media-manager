import "server-only";
import { prisma } from "@/lib/prisma";
import { zonedTimeToUtc, tzDayKey } from "@/lib/utils";
import { WEEKDAY_ROTATION } from "@/lib/rotation";

export function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}

const POINTS_PER_PUBLISHED = 3;
const POINTS_PER_OVERDUE = 3;

/** Pupio has no per-Reel deadline, but at least 1 Reel/day is required from this date on — 0 published that day costs 3 points. */
const PUPIO_MIN_PENALTY = 3;
const PUPIO_MIN_ENFORCEMENT_START = zonedTimeToUtc(2026, 8, 26, 0, 0);

/**
 * Counts how many fully-elapsed days (since PUPIO_MIN_ENFORCEMENT_START) had
 * zero published Pupio Reels for this worker, and returns the resulting
 * point penalty (3 per such day). Computed live from current task status,
 * same self-correcting approach as the overdue penalty above.
 */
async function getPupioMinimumPenalty(userId: string) {
  const tasks = await prisma.contentTask.findMany({
    where: {
      assignedUserId: userId,
      profile: { qualityTracked: true },
      deadlineAt: { gte: PUPIO_MIN_ENFORCEMENT_START, lt: new Date() },
    },
    select: { deadlineAt: true, status: true },
  });

  const publishedByDay = new Map<string, boolean>();
  for (const t of tasks) {
    const key = tzDayKey(t.deadlineAt);
    publishedByDay.set(key, (publishedByDay.get(key) ?? false) || t.status === "PUBLISHED");
  }

  const missedDays = Array.from(publishedByDay.values()).filter((published) => !published).length;
  return missedDays * PUPIO_MIN_PENALTY;
}

/** 1 bod = 1 € — motivačný prepočet maximálneho zárobku, nič sa naň nevypláca automaticky. */
const EUR_PER_POINT = 1;

/**
 * Best-case monthly earnings if every single scheduled Reel that month gets
 * published on time: (weekday-rotation Reels/day + active fixed-count
 * profiles' Reels/day, e.g. Pupio) × 3 body × days in month × 1 €/bod.
 * Derived from the live schedule config, not hardcoded, so it stays correct
 * if the rotation or Pupio's daily count ever changes.
 */
export async function getMaxMonthlyEarnings(year: number, month: number) {
  const fixedCountProfiles = await prisma.profile.findMany({
    where: { active: true, dailyReelCount: { gt: 0 } },
    select: { dailyReelCount: true },
  });
  const fixedReelsPerDay = fixedCountProfiles.reduce((sum, p) => sum + p.dailyReelCount, 0);

  const daysInMonth = new Date(year, month, 0).getDate();
  let totalReels = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const weekday = new Date(year, month - 1, day).getDay();
    const rotationReels = (WEEKDAY_ROTATION[weekday] ?? []).length;
    totalReels += rotationReels + fixedReelsPerDay;
  }

  const maxPoints = totalReels * POINTS_PER_PUBLISHED;
  return { maxPoints, maxEuros: maxPoints * EUR_PER_POINT, daysInMonth, totalReels };
}

/**
 * Full earnings picture for the current month, for a motivational banner:
 * how much he's already earned, how much he's already lost (overdue Reels +
 * Pupio no-Reel days), the monthly ceiling, and today's specific stakes —
 * how many Reels are still open today and what they're worth.
 */
export async function getEarningsSummary(userId: string) {
  const now = new Date();
  const [nowYear, nowMonth, nowDay] = tzDayKey(now).split("-").map(Number);
  const { start: monthStart, end: monthEnd } = monthRange(nowYear, nowMonth);

  const pupioRangeStart =
    monthStart < PUPIO_MIN_ENFORCEMENT_START ? PUPIO_MIN_ENFORCEMENT_START : monthStart;

  const todayStart = zonedTimeToUtc(nowYear, nowMonth, nowDay, 0, 0);
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const [publishedCount, overdueCount, pupioTasks, todayTasks, maxMonth] = await Promise.all([
    prisma.contentTask.count({
      where: { assignedUserId: userId, status: "PUBLISHED", deadlineAt: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.contentTask.count({
      where: { assignedUserId: userId, status: "OVERDUE", deadlineAt: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.contentTask.findMany({
      where: {
        assignedUserId: userId,
        profile: { qualityTracked: true },
        deadlineAt: { gte: pupioRangeStart, lt: now < monthEnd ? now : monthEnd },
      },
      select: { deadlineAt: true, status: true },
    }),
    prisma.contentTask.findMany({
      where: { assignedUserId: userId, deadlineAt: { gte: todayStart, lt: todayEnd }, status: { not: "CANCELLED" } },
      select: { status: true },
    }),
    getMaxMonthlyEarnings(nowYear, nowMonth),
  ]);

  const publishedByDay = new Map<string, boolean>();
  for (const t of pupioTasks) {
    const key = tzDayKey(t.deadlineAt);
    publishedByDay.set(key, (publishedByDay.get(key) ?? false) || t.status === "PUBLISHED");
  }
  const pupioMissedDays = Array.from(publishedByDay.values()).filter((published) => !published).length;

  const earnedPoints = publishedCount * POINTS_PER_PUBLISHED;
  const lostPoints = overdueCount * POINTS_PER_OVERDUE + pupioMissedDays * PUPIO_MIN_PENALTY;

  const todayTotal = todayTasks.length;
  const todayDone = todayTasks.filter((t) => t.status === "PUBLISHED").length;
  const todayRemaining = todayTotal - todayDone;

  return {
    earnedEuros: earnedPoints * EUR_PER_POINT,
    lostEuros: lostPoints * EUR_PER_POINT,
    overdueCount,
    pupioMissedDays,
    maxEuros: maxMonth.maxEuros,
    daysInMonth: maxMonth.daysInMonth,
    totalReelsMonth: maxMonth.totalReels,
    reelsPerDay: maxMonth.daysInMonth > 0 ? Math.round(maxMonth.totalReels / maxMonth.daysInMonth) : 0,
    todayTotal,
    todayDone,
    todayRemaining,
    todayRemainingEuros: todayRemaining * POINTS_PER_PUBLISHED * EUR_PER_POINT,
  };
}

/**
 * Worker score: bonusPoints (a manually set starting balance, set by an
 * admin) + 3 per published Reel - 3 per Reel that missed its deadline - 3
 * per day since 26.8.2026 with zero published Pupio Reels, plus the sum of
 * APPROVED adjustment entries (admin penalties, always pre-approved; worker
 * bonus requests only count once an admin approves them). The task-derived
 * parts are computed live from current status (not a stored counter), so
 * they self-correct if an admin later publishes an overdue task.
 */
export async function getUserPoints(userId: string) {
  const [user, published, overdue, pupioMinPenalty, adjustments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { bonusPoints: true } }),
    prisma.contentTask.count({ where: { assignedUserId: userId, status: "PUBLISHED" } }),
    prisma.contentTask.count({ where: { assignedUserId: userId, status: "OVERDUE" } }),
    getPupioMinimumPenalty(userId),
    prisma.pointsAdjustment.findMany({
      where: { userId, category: "GENERAL" },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const bonusPoints = user?.bonusPoints ?? 0;
  const approved = adjustments.filter((a) => a.status === "APPROVED");
  const adjustmentTotal = approved.reduce((sum, a) => sum + a.amount, 0);
  return {
    points:
      bonusPoints +
      published * POINTS_PER_PUBLISHED -
      overdue * POINTS_PER_OVERDUE -
      pupioMinPenalty +
      adjustmentTotal,
    bonusPoints,
    published,
    overdue,
    pupioMinPenalty,
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

/** A worker's active (not yet completed) marketing goals, with any linked completion request. */
export async function getActiveGoals(userId: string) {
  return prisma.marketingGoal.findMany({
    where: { userId, status: "ACTIVE" },
    include: { pointsAdjustment: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Full goal history (active + completed) for a worker, for the dedicated strategy page. */
export async function getAllGoalsForUser(userId: string) {
  return prisma.marketingGoal.findMany({
    where: { userId },
    include: { pointsAdjustment: true },
    orderBy: { createdAt: "desc" },
  });
}

/** All pending marketing-goal completion requests, for the admin dashboard. */
export async function getPendingGoalRequests() {
  return prisma.pointsAdjustment.findMany({
    where: { requestedByWorker: true, status: "PENDING", category: "GENERAL", goalId: { not: null } },
    include: {
      user: { select: { id: true, name: true } },
      goal: { select: { id: true, title: true, targetValue: true, currentValue: true, unit: true } },
    },
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
