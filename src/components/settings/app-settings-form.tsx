"use client";

import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { updateAppSettings } from "@/actions/settings";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Uložiť nastavenia
    </Button>
  );
}

export function AppSettingsForm({
  telegramBotToken,
  timezone,
}: {
  telegramBotToken: string | null;
  timezone: string;
}) {
  async function action(formData: FormData) {
    const result = await updateAppSettings(formData);
    if (result.ok) {
      toast.success("Nastavenia boli uložené.");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        label="Telegram Bot Token"
        htmlFor="telegramBotToken"
        hint="Vytvorte bota cez @BotFather. Ak necháte prázdne, Telegram notifikácie budú vypnuté."
      >
        <Input
          id="telegramBotToken"
          name="telegramBotToken"
          defaultValue={telegramBotToken ?? ""}
          placeholder="123456:ABC-DEF..."
        />
      </Field>
      <Field label="Časové pásmo" htmlFor="timezone">
        <Select id="timezone" name="timezone" defaultValue={timezone}>
          <option value="Europe/Bratislava">Europe/Bratislava</option>
          <option value="Europe/Prague">Europe/Prague</option>
          <option value="UTC">UTC</option>
        </Select>
      </Field>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
