"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Trash2 } from "lucide-react";
import { cancelTask, deleteTask } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function DangerZone({ taskId, status }: { taskId: string; status: string }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    setBusy(true);
    const result = await cancelTask(taskId);
    setBusy(false);
    setConfirmCancel(false);
    if (result.ok) {
      toast.success("Úloha bola zrušená.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    setBusy(true);
    const result = await deleteTask(taskId);
    setBusy(false);
    setConfirmDelete(false);
    if (result.ok) {
      toast.success("Úloha bola odstránená.");
      router.push("/content");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-5">
      <p className="text-sm font-semibold text-red-900">Nebezpečná zóna</p>
      <div className="flex flex-wrap gap-3">
        {status !== "CANCELLED" && status !== "PUBLISHED" && (
          <Button variant="outline" onClick={() => setConfirmCancel(true)}>
            <Ban className="h-4 w-4" />
            Zrušiť úlohu
          </Button>
        )}
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4" />
          Odstrániť
        </Button>
      </div>

      <Dialog open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Zrušiť úlohu?">
        <p className="mb-5 text-sm text-slate-600">
          Úloha bude označená ako zrušená a nebude sa počítať do štatistík ani upozornení.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmCancel(false)}>
            Späť
          </Button>
          <Button variant="danger" loading={busy} onClick={handleCancel}>
            Zrušiť úlohu
          </Button>
        </div>
      </Dialog>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Odstrániť úlohu?">
        <p className="mb-5 text-sm text-slate-600">
          Táto akcia je nezvratná. Úloha a jej štatistiky budú natrvalo odstránené.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            Späť
          </Button>
          <Button variant="danger" loading={busy} onClick={handleDelete}>
            Odstrániť natrvalo
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
