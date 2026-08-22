"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { resetOverdueStats } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function ResetOverdueButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleConfirm() {
    setBusy(true);
    const result = await resetOverdueStats();
    setBusy(false);
    setOpen(false);
    if (result.ok) {
      toast.success("Štatistika Po termíne bola vynulovaná.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw className="h-3.5 w-3.5" />
        Resetovať
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Resetovať štatistiku Po termíne?">
        <p className="mb-5 text-sm text-slate-600">
          Počet a zoznam &bdquo;Po termíne&rdquo; na dashboarde sa vynuluje od tohto momentu.
          Samotné úlohy sa nezmenia — pracovník ich stále uvidí a stále sa počítajú do jeho
          bodov. Ide len o zobrazenie na dashboarde.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Späť
          </Button>
          <Button loading={busy} onClick={handleConfirm}>
            Resetovať
          </Button>
        </div>
      </Dialog>
    </>
  );
}
