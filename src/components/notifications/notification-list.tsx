"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead, deleteAllNotifications } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDateTime } from "@/lib/utils";

const TYPE_ICON_TONE: Record<string, string> = {
  TASK_ASSIGNED: "bg-indigo-50 text-indigo-600",
  TASK_OVERDUE: "bg-red-50 text-red-600",
  TASK_PUBLISHED: "bg-emerald-50 text-emerald-600",
  SYSTEM: "bg-slate-100 text-slate-600",
};

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  taskId: string | null;
  read: boolean;
  createdAt: Date;
};

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRead(id: string) {
    const result = await markNotificationRead(id);
    if (result.ok) router.refresh();
  }

  async function handleReadAll() {
    const result = await markAllNotificationsRead();
    if (result.ok) {
      toast.success("Všetky notifikácie boli označené ako prečítané.");
      router.refresh();
    }
  }

  async function handleDeleteAll() {
    setDeleting(true);
    const result = await deleteAllNotifications();
    setDeleting(false);
    setConfirmDeleteAll(false);
    if (result.ok) {
      toast.success("Všetky notifikácie boli vymazané.");
      router.refresh();
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white">
        <EmptyState icon={Bell} title="Žiadne notifikácie" description="Tu sa zobrazia nové udalosti a upozornenia." />
      </div>
    );
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end gap-2">
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={handleReadAll}>
            <CheckCheck className="h-4 w-4" />
            Označiť všetky ako prečítané
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setConfirmDeleteAll(true)}>
          <Trash2 className="h-4 w-4" />
          Vymazať všetky notifikácie
        </Button>
      </div>

      <Dialog open={confirmDeleteAll} onClose={() => setConfirmDeleteAll(false)} title="Vymazať všetky notifikácie?">
        <p className="mb-5 text-sm text-slate-600">
          Táto akcia je nezvratná. Všetky tvoje notifikácie budú natrvalo odstránené.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDeleteAll(false)}>
            Späť
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDeleteAll}>
            Vymazať natrvalo
          </Button>
        </div>
      </Dialog>
      <div className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {notifications.map((n) => {
          const content = (
            <div
              className={cn(
                "flex items-start gap-3 px-5 py-4 transition-colors",
                !n.read && "bg-indigo-50/40"
              )}
            >
              <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", TYPE_ICON_TONE[n.type] ?? TYPE_ICON_TONE.SYSTEM)}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                </div>
                <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
              </div>
            </div>
          );

          return n.taskId ? (
            <Link key={n.id} href={`/tasks/${n.taskId}`} onClick={() => !n.read && handleRead(n.id)} className="hover:bg-slate-50">
              {content}
            </Link>
          ) : (
            <button key={n.id} onClick={() => !n.read && handleRead(n.id)} className="text-left hover:bg-slate-50">
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
