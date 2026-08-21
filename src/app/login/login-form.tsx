"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";
import { Input, Field } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending} size="lg">
      Prihlásiť sa
    </Button>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useActionState(loginAction, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl || ""} />
      <Field label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="meno@firma.sk" />
      </Field>
      <Field label="Heslo" htmlFor="password" required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
      </Field>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
