"use client";

import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { updateAnalytics } from "@/actions/tasks";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} size="sm">
      Uložiť metriky
    </Button>
  );
}

export function AnalyticsForm({
  taskId,
  analytics,
}: {
  taskId: string;
  analytics: {
    views: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    followersGained: number;
  } | null;
}) {
  const router = useRouter();

  async function action(formData: FormData) {
    const result = await updateAnalytics(taskId, formData);
    if (result.ok) {
      toast.success("Štatistiky boli uložené.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const a = analytics ?? {
    views: 0,
    reach: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    followersGained: 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Výkonnosť Reelu</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Zhliadnutia" htmlFor="views">
            <Input id="views" name="views" type="number" min={0} defaultValue={a.views} />
          </Field>
          <Field label="Dosah" htmlFor="reach">
            <Input id="reach" name="reach" type="number" min={0} defaultValue={a.reach} />
          </Field>
          <Field label="Páči sa mi to" htmlFor="likes">
            <Input id="likes" name="likes" type="number" min={0} defaultValue={a.likes} />
          </Field>
          <Field label="Komentáre" htmlFor="comments">
            <Input id="comments" name="comments" type="number" min={0} defaultValue={a.comments} />
          </Field>
          <Field label="Zdieľania" htmlFor="shares">
            <Input id="shares" name="shares" type="number" min={0} defaultValue={a.shares} />
          </Field>
          <Field label="Uložené" htmlFor="saves">
            <Input id="saves" name="saves" type="number" min={0} defaultValue={a.saves} />
          </Field>
          <Field label="Noví sledovatelia" htmlFor="followersGained">
            <Input id="followersGained" name="followersGained" type="number" min={0} defaultValue={a.followersGained} />
          </Field>
          <div className="col-span-2 flex items-end sm:col-span-4">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
