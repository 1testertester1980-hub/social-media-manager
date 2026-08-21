"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { allowLateSubmission } from "@/actions/tasks";
import { Button } from "@/components/ui/button";

export function AllowLateSubmissionButton({ taskId }: { taskId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setBusy(true);
    const result = await allowLateSubmission(taskId);
    setBusy(false);
    if (result.ok) {
      toast.success("Pracovník môže tento Reel teraz označiť ako zverejnený aj napriek termínu.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Button variant="outline" loading={busy} onClick={handleClick}>
      <KeyRound className="h-4 w-4" />
      Povoliť neskoršie zverejnenie
    </Button>
  );
}
