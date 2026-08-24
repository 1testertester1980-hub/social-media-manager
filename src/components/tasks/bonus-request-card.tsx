"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Sparkles, Clock, CheckCircle2, XCircle } from "lucide-react";
import { requestBonusPoints } from "@/actions/users";
import { Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending} disabled={disabled}>
      Odoslať žiadosť adminovi
    </Button>
  );
}

type ExistingRequest = { amount: number; status: "APPROVED" | "PENDING" | "REJECTED" } | null;

export function BonusRequestCard({ existingRequest }: { existingRequest: ExistingRequest }) {
  const [amount, setAmount] = useState<number | null>(null);
  const router = useRouter();

  async function action(formData: FormData) {
    if (!amount) {
      toast.error("Vyber si počet bodov (1-5).");
      return;
    }
    formData.set("amount", String(amount));
    const result = await requestBonusPoints(formData);
    if (result.ok) {
      toast.success("Žiadosť bola odoslaná adminovi na schválenie.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  if (existingRequest) {
    const { amount: reqAmount, status } = existingRequest;
    const config = {
      PENDING: {
        icon: Clock,
        tone: "bg-amber-50 border-amber-200 text-amber-800",
        text: `Žiadosť o +${reqAmount} b. čaká na schválenie administrátorom.`,
      },
      APPROVED: {
        icon: CheckCircle2,
        tone: "bg-emerald-50 border-emerald-200 text-emerald-800",
        text: `Schválené! Pripočítaných +${reqAmount} b.`,
      },
      REJECTED: {
        icon: XCircle,
        tone: "bg-red-50 border-red-200 text-red-800",
        text: `Žiadosť o +${reqAmount} b. bola zamietnutá. Skús to znova zajtra.`,
      },
    }[status];
    const Icon = config.icon;

    return (
      <div className={cn("flex items-center gap-3 rounded-2xl border p-4", config.tone)}>
        <Icon className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">{config.text}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4.5 w-4.5 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-900">Extra snaha dnes?</h3>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Ak si dnes urobil niečo navyše — extra snaha, výnimočne dobrý Reel, skvelé zhliadnutia,
        extra námaha — vyber si, koľko bodov by si si podľa seba zaslúžil. Admin to musí schváliť,
        až potom sa ti pripočítajú.
      </p>
      <form action={action} className="flex flex-col gap-4">
        <div className="flex justify-center gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAmount(n)}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg font-bold transition-all sm:h-14 sm:w-14",
                amount === n
                  ? "border-indigo-600 bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200"
                  : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <Textarea
          name="note"
          placeholder="Voliteľná poznámka — čo presne si dnes urobil navyše..."
          rows={2}
        />
        <SubmitButton disabled={!amount} />
      </form>
    </div>
  );
}
