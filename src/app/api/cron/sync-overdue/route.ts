import { NextResponse } from "next/server";
import { syncOverdueTasks } from "@/lib/overdue";
import { generateDailyTasks } from "@/lib/rotation";

// Wired up for Vercel Cron (see vercel.json). Also safe to hit manually.
// Runs both the daily rotation generator and the overdue sync in one call so
// a single (Hobby-plan-friendly) daily cron job covers both.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const daily = await generateDailyTasks();
  const overdue = await syncOverdueTasks();
  return NextResponse.json({ daily, overdue });
}
