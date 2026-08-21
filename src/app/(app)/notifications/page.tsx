import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Notifikácie</h1>
        <p className="text-sm text-slate-500">Prehľad udalostí a upozornení</p>
      </div>
      <NotificationList notifications={notifications} />
    </div>
  );
}
