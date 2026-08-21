import { redirect } from "next/navigation";
import { Trophy, CheckCircle2, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getUserPoints } from "@/lib/queries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AccountForm } from "@/components/account/account-form";
import { cn } from "@/lib/utils";

export default async function AccountPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) redirect("/login");

  const score = user.role === "WORKER" ? await getUserPoints(user.id) : null;

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
            <p className="text-xs text-slate-400">+3 body za každý včas zverejnený Reel, -3 body za každý, čo sa nestihol.</p>
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
