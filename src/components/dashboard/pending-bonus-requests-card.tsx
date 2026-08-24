"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Check, X } from "lucide-react";
import { decideBonusRequest } from "@/actions/users";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

type Request = {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
  user: { id: string; name: string };
};

function RequestRow({ request }: { request: Request }) {
  const [busy, setBusy] = useState<"APPROVE" | "REJECT" | null>(null);
  const router = useRouter();

  async function decide(decision: "APPROVE" | "REJECT") {
    setBusy(decision);
    const result = await decideBonusRequest(request.id, decision);
    setBusy(null);
    if (result.ok) {
      toast.success(decision === "APPROVE" ? "Body boli schválené." : "Žiadosť bola zamietnutá.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{request.user.name}</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
            +{request.amount} b.
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-500">{request.reason}</p>
        <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(request.createdAt)}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" loading={busy === "REJECT"} onClick={() => decide("REJECT")}>
          <X className="h-3.5 w-3.5" />
          Zamietnuť
        </Button>
        <Button size="sm" loading={busy === "APPROVE"} onClick={() => decide("APPROVE")}>
          <Check className="h-3.5 w-3.5" />
          Schváliť
        </Button>
      </div>
    </div>
  );
}

export function PendingBonusRequestsCard({ requests }: { requests: Request[] }) {
  if (requests.length === 0) return null;

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <CardTitle>Žiadosti o bonusové body ({requests.length})</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {requests.map((r) => (
          <RequestRow key={r.id} request={r} />
        ))}
      </CardContent>
    </Card>
  );
}
