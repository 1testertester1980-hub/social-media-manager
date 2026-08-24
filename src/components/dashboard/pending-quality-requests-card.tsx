"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gem, Timer, Check } from "lucide-react";
import { decideQualityRequest } from "@/actions/users";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { formatDateTime } from "@/lib/utils";

type Request = {
  id: string;
  amount: number;
  prepMinutes: number | null;
  createdAt: Date;
  user: { id: string; name: string };
  task: { id: string; title: string } | null;
};

function RequestRow({ request }: { request: Request }) {
  const [value, setValue] = useState(String(request.amount));
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function decide() {
    const decidedAmount = Number(value);
    if (!Number.isInteger(decidedAmount) || decidedAmount < 0) {
      toast.error("Zadajte platný počet bodov (0 alebo viac).");
      return;
    }
    setBusy(true);
    const result = await decideQualityRequest(request.id, decidedAmount);
    setBusy(false);
    if (result.ok) {
      toast.success(`Pridelených ${decidedAmount} b.`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-purple-100 bg-purple-50/30 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{request.user.name}</span>
          <span className="truncate text-sm text-slate-500">{request.task?.title}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" />
            {request.prepMinutes} min príprava
          </span>
          <span>Žiada: <strong className="text-purple-700">{request.amount} b.</strong></span>
          <span>{formatDateTime(request.createdAt)}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Input
          type="number"
          min={0}
          max={20}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-20 text-center"
        />
        <Button size="sm" loading={busy} onClick={decide}>
          <Check className="h-3.5 w-3.5" />
          Potvrdiť
        </Button>
      </div>
    </div>
  );
}

export function PendingQualityRequestsCard({ requests }: { requests: Request[] }) {
  if (requests.length === 0) return null;

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gem className="h-4 w-4 text-purple-500" />
          <CardTitle>Pupio — žiadosti o kvalitné body ({requests.length})</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-slate-500">
          Vyber si vlastný počet bodov (nezávisle od toho, čo žiadal pracovník) a potvrď.
        </p>
        {requests.map((r) => (
          <RequestRow key={r.id} request={r} />
        ))}
      </CardContent>
    </Card>
  );
}
