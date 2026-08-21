"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { createProfileSchema, updateProfileSchema } from "@/lib/validation";
import type { ActionResult } from "@/actions/tasks";

export async function createProfile(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = createProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Neplatné údaje", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const profile = await prisma.profile.create({
    data: {
      name: d.name,
      instagramUsername: d.instagramUsername || null,
      imageUrl: d.imageUrl || null,
      color: d.color,
      notes: d.notes || null,
    },
  });

  revalidatePath("/profiles");
  revalidatePath("/dashboard");
  return { ok: true, data: { id: profile.id } };
}

export async function updateProfile(profileId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateProfileSchema.safeParse({
    ...raw,
    active: raw.active === "true" ? true : raw.active === "false" ? false : undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Neplatné údaje", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const data: Record<string, unknown> = {};
  if (d.name) data.name = d.name;
  if (d.instagramUsername !== undefined) data.instagramUsername = d.instagramUsername || null;
  if (d.imageUrl !== undefined) data.imageUrl = d.imageUrl || null;
  if (d.color) data.color = d.color;
  if (d.notes !== undefined) data.notes = d.notes || null;
  if (d.active !== undefined) data.active = d.active;

  await prisma.profile.update({ where: { id: profileId }, data });

  revalidatePath("/profiles");
  revalidatePath(`/profiles/${profileId}`);
  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}

export async function toggleProfileActive(profileId: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  await prisma.profile.update({ where: { id: profileId }, data: { active } });
  revalidatePath("/profiles");
  return { ok: true, data: undefined };
}
