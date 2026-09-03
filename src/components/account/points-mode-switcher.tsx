"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Gauge, Rocket } from "lucide-react";
import { setPointsMode } from "@/actions/account";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const MODES = [
  {
    value: "STANDARD" as const,
    icon: Rocket,
    title: "Plný systém",
    description:
      "+3 body za bežný Reel, -5 bodov, ak nestihneš termín. Vyšší strop aj vyššie riziko mínusu.",
  },
  {
    value: "SIMPLE" as const,
    icon: Gauge,
    title: "Jednoduchý, bez odpočítavania",
    description:
      "2 bežné Reely za deň = +3 body dokopy. Za bežné Reely sa ti už nikdy nič nestrhne. Pupio ostáva úplne rovnaké.",
  },
];

export function PointsModeSwitcher({ current }: { current: "STANDARD" | "SIMPLE" }) {
  const [busy, setBusy] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<"SIMPLE" | null>(null);
  const router = useRouter();

  async function apply(mode: "STANDARD" | "SIMPLE") {
    setBusy(true);
    const result = await setPointsMode(mode);
    setBusy(false);
    setConfirmTarget(null);
    if (result.ok) {
      toast.success(
        mode === "SIMPLE" ? "Prepnuté na jednoduchý režim — začínaš s +15 bodmi." : "Prepnuté na plný systém."
      );
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function choose(mode: "STANDARD" | "SIMPLE") {
    if (mode === current) return;
    if (mode === "SIMPLE") {
      setConfirmTarget("SIMPLE");
      return;
    }
    apply(mode);
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            disabled={busy}
            onClick={() => choose(m.value)}
            className={cn(
              "flex flex-col gap-2 rounded-xl border p-4 text-left transition disabled:opacity-60",
              current === m.value ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className="flex items-center gap-2">
              <m.icon className={cn("h-4 w-4", current === m.value ? "text-indigo-600" : "text-slate-400")} />
              <span className="text-sm font-semibold text-slate-900">{m.title}</span>
              {current === m.value && <CheckCircle2 className="ml-auto h-4 w-4 text-indigo-600" />}
            </div>
            <p className="text-xs text-slate-600">{m.description}</p>
          </button>
        ))}
      </div>

      <Dialog open={confirmTarget === "SIMPLE"} onClose={() => setConfirmTarget(null)} title="Prepnúť na jednoduchý režim?">
        <p className="mb-5 text-sm text-slate-600">
          Tvoj zostatok sa nastaví na <strong>+15 bodov</strong> — čistý, povzbudivý štart. Od
          tohto momentu za 2 bežné Reely denne dostaneš +3 body dokopy a nikdy sa ti za ne nič
          nestrhne. Pupio ostáva úplne rovnaké (1 bod/Reel, pravidlo 1 Reelu denne). Kedykoľvek sa
          môžeš vrátiť späť na plný systém.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmTarget(null)}>
            Späť
          </Button>
          <Button loading={busy} onClick={() => apply("SIMPLE")}>
            Prepnúť a začať s +15 b.
          </Button>
        </div>
      </Dialog>
    </>
  );
}
