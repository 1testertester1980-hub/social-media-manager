"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { MinusCircle } from "lucide-react";
import { addPointsPenalty } from "@/actions/users";
import { Dialog } from "@/components/ui/dialog";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" loading={pending}>
      Odpočítať body
    </Button>
  );
}

type Adjustment = {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
  status: "APPROVED" | "PENDING" | "REJECTED";
};

export function PenaltyDialog({
  userId,
  userName,
  history,
}: {
  userId: string;
  userName: string;
  history: Adjustment[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function action(formData: FormData) {
    const result = await addPointsPenalty(userId, formData);
    if (result.ok) {
      toast.success(`Body boli odpočítané pracovníkovi ${userName}.`);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MinusCircle className="h-3.5 w-3.5" />
        Penalizovať
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Penalizovať: ${userName}`}>
        <form action={action} className="flex flex-col gap-4">
          <Field label="Počet bodov" htmlFor="amount" required>
            <Select id="amount" name="amount" defaultValue="-1" required>
              <option value="-1">-1 bod</option>
              <option value="-2">-2 body</option>
              <option value="-3">-3 body</option>
            </Select>
          </Field>
          <Field label="Dôvod" htmlFor="reason" required>
            <Textarea id="reason" name="reason" required rows={3} placeholder="Napr. neskoré zverejnenie bez ospravedlnenia" />
          </Field>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Zrušiť
            </Button>
            <SubmitButton />
          </div>
        </form>

        {history.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              História penalizácií a žiadostí
            </p>
            {history.some((h) => h.status !== "APPROVED") && (
              <p className="mb-2 text-xs text-slate-400">
                Do súčtu bodov sa počítajú len schválené položky.
              </p>
            )}
            <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="rounded-lg bg-red-50 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-red-700">{h.amount} b.</span>
                    <div className="flex items-center gap-2">
                      {h.status === "PENDING" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          čaká na schválenie
                        </span>
                      )}
                      {h.status === "REJECTED" && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                          zamietnuté
                        </span>
                      )}
                      <span className="text-xs text-slate-400">{formatDateTime(h.createdAt)}</span>
                    </div>
                  </div>
                  <p className="mt-0.5 text-slate-600">{h.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
