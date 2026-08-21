"use client";

import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { updateOwnAccount } from "@/actions/account";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Uložiť zmeny
    </Button>
  );
}

export function AccountForm({ telegramChatId }: { telegramChatId: string | null }) {
  async function action(formData: FormData) {
    const result = await updateOwnAccount(formData);
    if (result.ok) {
      toast.success("Nastavenia boli uložené.");
      const form = document.getElementById("account-password") as HTMLInputElement | null;
      if (form) form.value = "";
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Telegram Chat ID" htmlFor="telegramChatId" hint="Pre zasielanie notifikácií cez Telegram">
        <Input id="telegramChatId" name="telegramChatId" defaultValue={telegramChatId ?? ""} placeholder="Napr. 123456789" />
      </Field>
      <Field label="Nové heslo" htmlFor="account-password" hint="Nechajte prázdne, ak nechcete meniť heslo">
        <Input id="account-password" name="password" type="password" placeholder="••••••••" />
      </Field>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
