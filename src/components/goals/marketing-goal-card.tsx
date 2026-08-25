"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Target, Plus, Clock, ArrowRight } from "lucide-react";
import { createMarketingGoal, updateGoalProgress, requestGoalCompletion, deleteGoal } from "@/actions/goals";
import { Input, Field } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Goal = {
  id: string;
  title: string;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  pointsAdjustment: { status: "PENDING" | "APPROVED" | "REJECTED"; amount: number } | null;
};

function GoalRow({ goal }: { goal: Goal }) {
  const router = useRouter();
  const [progress, setProgress] = useState(String(goal.currentValue ?? 0));
  const [savingProgress, setSavingProgress] = useState(false);
  const [picking, setPicking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pending = goal.pointsAdjustment?.status === "PENDING";
  const pct =
    goal.targetValue && goal.targetValue > 0
      ? Math.min(100, Math.round(((goal.currentValue ?? 0) / goal.targetValue) * 100))
      : null;

  async function saveProgress() {
    setSavingProgress(true);
    const fd = new FormData();
    fd.set("currentValue", progress);
    const result = await updateGoalProgress(goal.id, fd);
    setSavingProgress(false);
    if (result.ok) {
      toast.success("Postup uložený.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function complete(points: number) {
    setSubmitting(true);
    const result = await requestGoalCompletion(goal.id, points);
    setSubmitting(false);
    setPicking(false);
    if (result.ok) {
      toast.success("Žiadosť bola odoslaná adminovi na schválenie.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function remove() {
    const result = await deleteGoal(goal.id);
    if (result.ok) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
        {!pending && (
          <button onClick={remove} className="shrink-0 text-xs text-slate-400 hover:text-red-600">
            Odstrániť
          </button>
        )}
      </div>

      {goal.targetValue !== null && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {goal.currentValue ?? 0} / {goal.targetValue} {goal.unit ?? ""}
            </span>
            {pct !== null && <span>{pct}%</span>}
          </div>
          {pct !== null && (
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      )}

      {pending ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          <Clock className="h-3.5 w-3.5" />
          Žiadosť o +{goal.pointsAdjustment?.amount} b. čaká na schválenie administrátorom.
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={0}
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
          <Button variant="outline" size="sm" loading={savingProgress} onClick={saveProgress}>
            Uložiť postup
          </Button>
          {picking ? (
            <div className="flex items-center gap-2">
              <Button size="sm" loading={submitting} onClick={() => complete(5)}>
                5 b.
              </Button>
              <Button size="sm" loading={submitting} onClick={() => complete(10)}>
                10 b.
              </Button>
              <button onClick={() => setPicking(false)} className="text-xs text-slate-400 hover:text-slate-600">
                Zrušiť
              </button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setPicking(true)}>
              Označiť ako splnené
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function MarketingGoalCard({ goals }: { goals: Goal[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function action(formData: FormData) {
    setSubmitting(true);
    const result = await createMarketingGoal(formData);
    setSubmitting(false);
    if (result.ok) {
      toast.success("Cieľ bol pridaný.");
      setShowAdd(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4.5 w-4.5 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Marketingová stratégia</h3>
        </div>
        <Link
          href="/marketing-strategia"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          Zobraziť všetko
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {goals.length === 0 && !showAdd && (
        <p className="mb-4 text-sm text-slate-500">
          Zatiaľ nemáš žiadny cieľ. Napríklad: dosiahnuť 5 000 zhliadnutí tento mesiac, alebo zvýšiť
          počet sledovateľov na 200.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {goals.map((goal) => (
          <GoalRow key={goal.id} goal={goal} />
        ))}
      </div>

      {showAdd ? (
        <form action={action} className={cn("mt-3 flex flex-col gap-3 rounded-xl border border-slate-200 p-4", goals.length > 0 && "mt-4")}>
          <Field label="Cieľ" htmlFor="title" required>
            <Input id="title" name="title" required placeholder="napr. 5000 zhliadnutí tento mesiac" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cieľová hodnota (voliteľné)" htmlFor="targetValue">
              <Input id="targetValue" name="targetValue" type="number" min={1} placeholder="5000" />
            </Field>
            <Field label="Jednotka (voliteľné)" htmlFor="unit">
              <Input id="unit" name="unit" placeholder="zhliadnutí" />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>
              Zrušiť
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              Pridať cieľ
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Nový cieľ
        </Button>
      )}
    </div>
  );
}
