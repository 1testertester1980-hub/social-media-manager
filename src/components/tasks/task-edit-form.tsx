"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { updateTask } from "@/actions/tasks";
import { Field, Input, Textarea, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Profile = { id: string; name: string };
type Worker = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Uložiť zmeny
    </Button>
  );
}

export function TaskEditForm({
  task,
  profiles,
  workers,
}: {
  task: {
    id: string;
    profileId: string;
    title: string;
    topic: string | null;
    brief: string | null;
    caption: string | null;
    assignedUserId: string | null;
    deadlineAt: Date;
    adminNotes: string | null;
    attachmentUrl: string | null;
    status: string;
  };
  profiles: Profile[];
  workers: Worker[];
}) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  async function action(formData: FormData) {
    const result = await updateTask(task.id, formData);
    if (result.ok) {
      toast.success("Zmeny boli uložené.");
      setEditing(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const deadlineDate = task.deadlineAt.toISOString().slice(0, 10);
  const deadlineTime = task.deadlineAt.toISOString().slice(11, 16);

  if (!editing) {
    return (
      <Button variant="outline" onClick={() => setEditing(true)}>
        <Pencil className="h-4 w-4" />
        Upraviť
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upraviť Reel</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Profil" htmlFor="profileId" required>
              <Select id="profileId" name="profileId" defaultValue={task.profileId} required>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priradiť pracovníkovi" htmlFor="assignedUserId">
              <Select id="assignedUserId" name="assignedUserId" defaultValue={task.assignedUserId ?? ""}>
                <option value="">Nepriradené</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Názov" htmlFor="title" required>
            <Input id="title" name="title" defaultValue={task.title} required />
          </Field>

          <Field label="Téma" htmlFor="topic">
            <Input id="topic" name="topic" defaultValue={task.topic ?? ""} />
          </Field>

          <Field label="Brief" htmlFor="brief">
            <Textarea id="brief" name="brief" rows={5} defaultValue={task.brief ?? ""} />
          </Field>

          <Field label="Popis (caption)" htmlFor="caption">
            <Textarea id="caption" name="caption" rows={4} defaultValue={task.caption ?? ""} />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Termín - dátum" htmlFor="deadlineDate" required>
              <Input id="deadlineDate" name="deadlineDate" type="date" defaultValue={deadlineDate} required />
            </Field>
            <Field label="Termín - čas" htmlFor="deadlineTime" required>
              <Input id="deadlineTime" name="deadlineTime" type="time" defaultValue={deadlineTime} required />
            </Field>
          </div>

          <Field label="Stav" htmlFor="status">
            <Select id="status" name="status" defaultValue={task.status}>
              <option value="PLANNED">Naplánované</option>
              <option value="TODO">Na spracovanie</option>
              <option value="PUBLISHED">Zverejnené</option>
              <option value="OVERDUE">Po termíne</option>
              <option value="CANCELLED">Zrušené</option>
            </Select>
          </Field>

          <Field label="Poznámky pre administrátora" htmlFor="adminNotes">
            <Textarea id="adminNotes" name="adminNotes" rows={3} defaultValue={task.adminNotes ?? ""} />
          </Field>

          <Field label="Príloha (URL)" htmlFor="attachmentUrl">
            <Input id="attachmentUrl" name="attachmentUrl" type="url" defaultValue={task.attachmentUrl ?? ""} />
          </Field>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Zrušiť
            </Button>
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
