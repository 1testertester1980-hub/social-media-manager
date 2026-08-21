"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleProfileActive } from "@/actions/profiles";
import { Button } from "@/components/ui/button";

export function ToggleActiveButton({ profileId, active }: { profileId: string; active: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setBusy(true);
    const result = await toggleProfileActive(profileId, !active);
    setBusy(false);
    if (result.ok) {
      toast.success(active ? "Profil bol deaktivovaný." : "Profil bol aktivovaný.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Button variant={active ? "outline" : "secondary"} size="sm" loading={busy} onClick={handleClick}>
      {active ? "Deaktivovať" : "Aktivovať"}
    </Button>
  );
}
