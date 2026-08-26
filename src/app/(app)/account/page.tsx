import { redirect } from "next/navigation";
import { Trophy, CheckCircle2, AlertTriangle, MinusCircle, Gem, Timer, Clock, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getUserPoints, getUserQualityPoints, getMaxMonthlyEarnings } from "@/lib/queries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AccountForm } from "@/components/account/account-form";
import { cn, formatDateTime, tzDayKey } from "@/lib/utils";

const MONTH_NAMES_SK = [
  "január", "február", "marec", "apríl", "máj", "jún",
  "júl", "august", "september", "október", "november", "december",
];

export default async function AccountPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) redirect("/login");

  const score = user.role === "WORKER" ? await getUserPoints(user.id) : null;
  const qualityScore = user.role === "WORKER" ? await getUserQualityPoints(user.id) : null;
  const [nowYear, nowMonth] = tzDayKey(new Date()).split("-").map(Number);
  const maxEarnings = user.role === "WORKER" ? await getMaxMonthlyEarnings(nowYear, nowMonth) : null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Môj profil</h1>
        <p className="text-sm text-slate-500">{user.name} · {user.email}</p>
      </div>

      {score && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <CardTitle>Moje body</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p
              className={cn(
                "text-4xl font-bold",
                score.points >= 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              {score.points >= 0 ? "+" : ""}
              {score.points} b.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-800">
                  {score.published}× zverejnené (+{score.published * 3} b.)
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">
                  {score.overdue}× po termíne (-{score.overdue * 3} b.)
                </span>
              </div>
              {score.pupioMinPenalty > 0 && (
                <div className="col-span-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">
                    Pupio bez Reelu: -{score.pupioMinPenalty} b.
                  </span>
                </div>
              )}
              {score.bonusPoints !== 0 && (
                <div className="col-span-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
                  <Trophy className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    Bonusové body: {score.bonusPoints >= 0 ? "+" : ""}
                    {score.bonusPoints} b.
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400">
              +3 body za každý včas zverejnený Reel, -3 body za každý, čo sa nestihol. Od 26. 8.
              2026 aj -3 body za každý deň, kedy nezverejníš aspoň 1 Pupio Reel.
            </p>
          </CardContent>
        </Card>
      )}

      {maxEarnings && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <CardTitle>Koľko môžeš tento mesiac zarobiť</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-4xl font-bold text-emerald-700">{maxEarnings.maxEuros} €</p>
            <p className="text-sm text-slate-600">
              Ak zverejníš úplne <strong>každý</strong> naplánovaný Reel v {MONTH_NAMES_SK[nowMonth - 1]} —{" "}
              {maxEarnings.totalReels} Reelov × 3 body — získaš až {maxEarnings.maxPoints} bodov.
              1 bod = 1 €.
            </p>
          </CardContent>
        </Card>
      )}

      {score && score.adjustments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MinusCircle className="h-4 w-4 text-red-500" />
              <CardTitle>Penalizácie</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {score.adjustments.map((a) => (
              <div key={a.id} className="rounded-lg bg-red-50 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-red-700">{a.amount} b.</span>
                  <span className="text-xs text-slate-400">{formatDateTime(a.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-slate-600">{a.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {qualityScore && (
        <Card className="border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gem className="h-4 w-4 text-purple-500" />
              <CardTitle>Pupio kvalita (oddelené body)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-4xl font-bold text-purple-600">{qualityScore.points} b.</p>
            <p className="text-xs text-slate-400">
              Tieto body sú úplne oddelené od bežných bodov. Za každý Pupio Reel zadáš čas
              prípravy a koľko bodov by si chcel — admin nezávisle rozhodne o finálnom počte.
            </p>
            {qualityScore.adjustments.length > 0 && (
              <div className="flex flex-col gap-2">
                {qualityScore.adjustments.map((a) => (
                  <div key={a.id} className="rounded-lg bg-purple-50 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium text-slate-900">{a.task?.title ?? a.reason}</span>
                      {a.status === "APPROVED" ? (
                        <span className="shrink-0 font-semibold text-purple-700">
                          {a.decidedAmount ?? a.amount} b.
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs font-medium text-amber-600">
                          <Clock className="mr-1 inline h-3 w-3" />
                          čaká
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                      {a.prepMinutes !== null && (
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {a.prepMinutes} min
                        </span>
                      )}
                      <span>žiadal si {a.amount} b.</span>
                      <span>{formatDateTime(a.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nastavenia účtu</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountForm telegramChatId={user.telegramChatId} />
        </CardContent>
      </Card>
    </div>
  );
}
