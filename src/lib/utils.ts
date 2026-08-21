import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | null | undefined) {
  if (n === null || n === undefined) return "0";
  return new Intl.NumberFormat("sk-SK").format(n);
}

export function formatPercent(n: number) {
  return `${Math.round(n * 10) / 10}%`;
}

const TZ = "Europe/Bratislava";

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("sk-SK", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("sk-SK", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("sk-SK", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** yyyy-MM-dd key for the given instant as seen in the app timezone. */
export function tzDayKey(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

export function isToday(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const fmt = (dd: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(dd);
  return fmt(d) === fmt(now);
}

/** Derives the effective, display status of a task without mutating stored data. */
export function effectiveStatus(task: { status: string; deadlineAt: Date | string }) {
  if (task.status === "PUBLISHED" || task.status === "CANCELLED") return task.status;
  const deadline = typeof task.deadlineAt === "string" ? new Date(task.deadlineAt) : task.deadlineAt;
  if (deadline.getTime() < Date.now()) return "OVERDUE";
  return task.status;
}
