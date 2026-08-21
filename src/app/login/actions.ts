"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = (formData.get("callbackUrl") as string) || undefined;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Nesprávny email alebo heslo." };
    }
    throw error;
  }
}
