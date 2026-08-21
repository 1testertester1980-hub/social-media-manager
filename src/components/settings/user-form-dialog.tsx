"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createUser, updateUser } from "@/actions/users";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

type ExistingUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "WORKER";
  telegramChatId: string | null;
  active: boolean;
  bonusPoints: number;
};

export function UserFormDialog({ mode = "create", user, trigger }: { mode?: "create" | "edit"; user?: ExistingUser; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function action(formData: FormData) {
    const result = mode === "edit" && user ? await updateUser(user.id, formData) : await createUser(formData);
    if (result.ok) {
      toast.success(mode === "edit" ? "Používateľ bol upravený." : "Používateľ bol vytvorený.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nový používateľ
        </Button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={mode === "edit" ? "Upraviť používateľa" : "Nový používateľ"}>
        <form action={action} className="flex flex-col gap-4">
          {mode === "create" && (
            <>
              <Field label="Meno" htmlFor="name" required>
                <Input id="name" name="name" required />
              </Field>
              <Field label="Email" htmlFor="email" required>
                <Input id="email" name="email" type="email" required />
              </Field>
              <Field label="Heslo" htmlFor="password" required>
                <Input id="password" name="password" type="password" required minLength={6} />
              </Field>
            </>
          )}
          {mode === "edit" && (
            <Field label="Meno" htmlFor="name">
              <Input id="name" name="name" defaultValue={user?.name} />
            </Field>
          )}
          <Field label="Rola" htmlFor="role">
            <Select id="role" name="role" defaultValue={user?.role ?? "WORKER"}>
              <option value="WORKER">Worker</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Field>
          <Field label="Telegram Chat ID" htmlFor="telegramChatId">
            <Input id="telegramChatId" name="telegramChatId" defaultValue={user?.telegramChatId ?? ""} />
          </Field>
          {mode === "edit" && (
            <Field label="Nové heslo" htmlFor="password" hint="Nechajte prázdne, ak nechcete meniť heslo">
              <Input id="password" name="password" type="password" minLength={6} />
            </Field>
          )}
          {mode === "edit" && (
            <Field label="Stav" htmlFor="active">
              <Select id="active" name="active" defaultValue={user?.active ? "true" : "false"}>
                <option value="true">Aktívny</option>
                <option value="false">Neaktívny</option>
              </Select>
            </Field>
          )}
          {mode === "edit" && user?.role === "WORKER" && (
            <Field
              label="Bonusové body"
              htmlFor="bonusPoints"
              hint="Pripočíta/odpočíta sa k bodom zo zverejnených/zameškaných Reelov"
            >
              <Input id="bonusPoints" name="bonusPoints" type="number" step={1} defaultValue={user?.bonusPoints ?? 0} />
            </Field>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Zrušiť
            </Button>
            <SubmitButton label={mode === "edit" ? "Uložiť zmeny" : "Vytvoriť"} />
          </div>
        </form>
      </Dialog>
    </>
  );
}
