"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createProfile, updateProfile } from "@/actions/profiles";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

const PRESET_COLORS = ["#6366f1", "#22c55e", "#f97316", "#ec4899", "#0ea5e9", "#a855f7", "#eab308", "#ef4444"];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

type ExistingProfile = {
  id: string;
  name: string;
  instagramUsername: string | null;
  imageUrl: string | null;
  color: string;
  notes: string | null;
};

export function ProfileFormDialog({
  mode = "create",
  profile,
  trigger,
}: {
  mode?: "create" | "edit";
  profile?: ExistingProfile;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(profile?.color ?? "#6366f1");
  const router = useRouter();

  async function action(formData: FormData) {
    formData.set("color", color);
    const result =
      mode === "edit" && profile ? await updateProfile(profile.id, formData) : await createProfile(formData);
    if (result.ok) {
      toast.success(mode === "edit" ? "Profil bol upravený." : "Profil bol vytvorený.");
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
          Nový profil
        </Button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={mode === "edit" ? "Upraviť profil" : "Nový profil"}>
        <form action={action} className="flex flex-col gap-4">
          <Field label="Názov" htmlFor="name" required>
            <Input id="name" name="name" required defaultValue={profile?.name} />
          </Field>
          <Field label="Instagram username" htmlFor="instagramUsername">
            <Input id="instagramUsername" name="instagramUsername" placeholder="@username" defaultValue={profile?.instagramUsername ?? ""} />
          </Field>
          <Field label="URL profilového obrázka" htmlFor="imageUrl">
            <Input id="imageUrl" name="imageUrl" type="url" defaultValue={profile?.imageUrl ?? ""} />
          </Field>
          <Field label="Farba" htmlFor="color">
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full ring-2 ring-offset-2"
                  style={{ backgroundColor: c, ["--tw-ring-color" as string]: color === c ? c : "transparent" }}
                  aria-label={c}
                />
              ))}
            </div>
          </Field>
          <Field label="Interné poznámky" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={3} defaultValue={profile?.notes ?? ""} />
          </Field>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Zrušiť
            </Button>
            <SubmitButton label={mode === "edit" ? "Uložiť zmeny" : "Vytvoriť profil"} />
          </div>
        </form>
      </Dialog>
    </>
  );
}
