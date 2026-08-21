"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createTask } from "@/actions/tasks";
import { Field, Input, Textarea, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

type Profile = { id: string; name: string; color: string };
type Worker = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" loading={pending}>
      Vytvoriť Reel
    </Button>
  );
}

const initialState = { ok: false as const, error: "", fieldErrors: undefined as Record<string, string[]> | undefined };

export function TaskForm({
  profiles,
  workers,
  defaultProfileId,
  defaultDate,
}: {
  profiles: Profile[];
  workers: Worker[];
  defaultProfileId?: string;
  defaultDate?: string;
}) {
  const router = useRouter();

  async function action(_prevState: unknown, formData: FormData) {
    const result = await createTask(formData);
    return result;
  }

  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success("Reel bol úspešne vytvorený.");
      router.push(`/tasks/${(state.data as { id: string }).id}`);
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const errors = state.ok ? {} : (state.fieldErrors ?? {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Profil" htmlFor="profileId" required error={errors.profileId?.[0]}>
          <Select id="profileId" name="profileId" defaultValue={defaultProfileId} required>
            <option value="">Vyberte profil</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priradiť pracovníkovi" htmlFor="assignedUserId">
          <Select id="assignedUserId" name="assignedUserId" defaultValue="">
            <option value="">Nepriradené</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Názov" htmlFor="title" required error={errors.title?.[0]}>
        <Input id="title" name="title" required placeholder="Napr. 3 veci, ktoré by som vedel pred prijímačkami" />
      </Field>

      <Field label="Téma" htmlFor="topic" error={errors.topic?.[0]}>
        <Input id="topic" name="topic" placeholder="Krátky popis témy" />
      </Field>

      <Field label="Brief" htmlFor="brief" hint="Detailné inštrukcie pre pracovníka" error={errors.brief?.[0]}>
        <Textarea id="brief" name="brief" rows={5} />
      </Field>

      <Field label="Popis (caption)" htmlFor="caption" error={errors.caption?.[0]}>
        <Textarea id="caption" name="caption" rows={4} />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Termín - dátum" htmlFor="deadlineDate" required error={errors.deadlineDate?.[0]}>
          <Input id="deadlineDate" name="deadlineDate" type="date" required defaultValue={defaultDate} />
        </Field>
        <Field label="Termín - čas" htmlFor="deadlineTime" required error={errors.deadlineTime?.[0]}>
          <Input id="deadlineTime" name="deadlineTime" type="time" required defaultValue="19:00" />
        </Field>
      </div>

      <Field label="Poznámky pre administrátora" htmlFor="adminNotes" hint="Interné, pracovník ich nevidí" error={errors.adminNotes?.[0]}>
        <Textarea id="adminNotes" name="adminNotes" rows={3} />
      </Field>

      <Field label="Príloha (URL)" htmlFor="attachmentUrl" hint="Odkaz na súbor, napr. Google Drive" error={errors.attachmentUrl?.[0]}>
        <Input id="attachmentUrl" name="attachmentUrl" type="url" placeholder="https://..." />
      </Field>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
