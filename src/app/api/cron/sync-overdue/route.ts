import { NextResponse } from "next/server";
import { syncOverdueTasks } from "@/lib/overdue";

// Wired up for Vercel Cron (see vercel.json). Also safe to hit manually.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await syncOverdueTasks();
  return NextResponse.json(result);
}
