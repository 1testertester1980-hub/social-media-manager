"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { CheckCircle2, Timer } from "lucide-react";
import { publishTask } from "@/actions/tasks";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      Potvrdiť zverejnenie
    </Button>
  );
}

export function PublishForm({ taskId, qualityTracked = false }: { taskId: string; qualityTracked?: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function action(formData: FormData) {
    const result = await publishTask(taskId, formData);
    if (result.ok) {
      toast.success(
        qualityTracked
          ? "Reel bol zverejnený. Žiadosť o kvalitné body čaká na rozhodnutie admina."
          : "Reel bol úspešne označený ako zverejnený."
      );
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  if (!open) {
    return (
      <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
        <CheckCircle2 className="h-4 w-4" />
        Zverejnil som Reel
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-900">Potvrdenie zverejnenia</p>
      <Field label="Instagram Reel URL" htmlFor="instagramUrl" required>
        <Input
          id="instagramUrl"
          name="instagramUrl"
          type="url"
          required
          placeholder="https://www.instagram.com/reel/..."
        />
      </Field>
      <Field label="Zverejnené" htmlFor="publishedAt">
        <Input id="publishedAt" value={formatDateTime(new Date())} disabled readOnly />
      </Field>
      <Field label="Poznámka (voliteľné)" htmlFor="workerNote">
        <Textarea id="workerNote" name="workerNote" rows={3} />
      </Field>

      {qualityTracked && (
        <div className="flex flex-col gap-4 rounded-xl border border-purple-200 bg-purple-50/50 p-4">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-purple-600" />
            <p className="text-sm font-semibold text-purple-900">Kvalita a čas prípravy</p>
          </div>
          <p className="text-xs text-purple-700">
            Tento profil má dôraz na kvalitu. Zapíš, koľko minút si strávil prípravou a tvorbou tohto
            Reelu (bez limitu), a koľko bodov by si za to chcel — admin následne sám rozhodne o
            konečnom počte.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minúty prípravy" htmlFor="prepMinutes" required>
              <Input id="prepMinutes" name="prepMinutes" type="number" min={1} required placeholder="Napr. 45" />
            </Field>
            <Field label="Koľko bodov by si chcel?" htmlFor="requestedPoints" required>
              <Input id="requestedPoints" name="requestedPoints" type="number" min={1} max={10} required placeholder="1-10" />
            </Field>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
          Zrušiť
        </Button>
        <div className="flex-[2]">
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
