import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { syncOverdueTasks } from "@/lib/overdue";
import { generateDailyTasks } from "@/lib/rotation";
import {
  announcePupioMinimumRuleIfNeeded,
  announceOverduePenaltyIncreaseIfNeeded,
  announcePupioPublishRateChangeIfNeeded,
} from "@/lib/notify";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  await generateDailyTasks();
  await syncOverdueTasks();
  await announcePupioMinimumRuleIfNeeded();
  await announceOverduePenaltyIncreaseIfNeeded();
  await announcePupioPublishRateChangeIfNeeded();

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block">
        <Sidebar role={user.role} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader role={user.role} userName={user.name ?? user.email ?? "Používateľ"} unreadCount={unreadCount} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
