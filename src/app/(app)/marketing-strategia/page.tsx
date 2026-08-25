import { redirect } from "next/navigation";
import { Calendar, CheckCircle2, Clock, XCircle, Target } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getActiveGoals, getAllGoalsForUser } from "@/lib/queries";
import { MarketingGoalCard } from "@/components/goals/marketing-goal-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const CORE_PROFILES = ["Mediktest.sk", "Chlapec na medicíne", "Dievča na medicíne"];
const TEST_PROFILES = ["Mediktest.cz", "StudiGenius", "Pupio"];

function DirectionCard() {
  return (
    <Card className="border-indigo-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-600" />
          <CardTitle>Naše marketingové smerovanie</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm text-slate-700">
        <p>
          Od 1. 11. chceme zjednodušiť systém tvorby Reels a sústrediť kapacitu najmä na nosné
          projekty. Nosné platformy sú <strong>Mediktest.sk</strong>, <strong>Chlapec na medicíne</strong>{" "}
          a <strong>Dievča na medicíne</strong> – tieto pokračujú v tvorbe Reels aj naďalej.
        </p>
        <p>
          Ostatné projekty budeme do 1. 11. brať ako testovacie. Ide konkrétne o{" "}
          <strong>Mediktest.cz</strong>, <strong>StudiGenius</strong> a <strong>Pupio</strong>. Dôležitým
          kritériom nebude iba počet views, lajkov alebo followerov, ale predovšetkým to, či obsah
          dokáže priniesť reálne registrácie a platby.
        </p>
        <p>
          1. 11. bude rozhodovací bod. Ak do tohto dátumu nepríde na Mediktest.cz žiadna platba,
          ďalšia tvorba Reels pre tento projekt sa zastaví. Rovnako, ak do 1. 11. nepríde žiadna
          platba na StudiGenius, Reels pre StudiGenius sa prestanú vyrábať. Pri Pupio platí rovnaké
          pravidlo – ak do 1. 11. nepríde žiadna platba, aktívna tvorba Reels pre Pupio sa zastaví.
        </p>
        <p>
          Cieľom teda nie je dlhodobo vyrábať obsah pre všetky platformy rovnakým spôsobom. Chceme
          testovať viac projektov, ale následne ponechať iba tie, ktoré ukážu reálny obchodný
          potenciál. Ak projekt dokáže cez sociálne siete priniesť zákazníkov a platby, pokračujeme
          v ňom. Ak do 1. 11. neprinesie ani jednu platbu, prestávame doň investovať čas na tvorbu
          Reels.
        </p>
        <p>
          Výsledkom má byť postupné sústredenie produkcie na Mediktest.sk, Chlapec na medicíne a
          Dievča na medicíne a iba na tie ďalšie projekty, ktoré preukážu, že majú potenciál
          zarábať.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">Nosné platformy</p>
            <ul className="mt-2 flex flex-col gap-1">
              {CORE_PROFILES.map((p) => (
                <li key={p} className="text-sm text-emerald-800">
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase">
              Testovacie do 1. 11.
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {TEST_PROFILES.map((p) => (
                <li key={p} className="text-sm text-amber-800">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_CONFIG = {
  ACTIVE_PENDING: { icon: Clock, tone: "text-amber-600", label: "Čaká na schválenie" },
  COMPLETED: { icon: CheckCircle2, tone: "text-emerald-600", label: "Splnené" },
  REJECTED: { icon: XCircle, tone: "text-red-500", label: "Zamietnuté" },
};

function GoalHistoryRow({
  goal,
}: {
  goal: {
    id: string;
    title: string;
    status: "ACTIVE" | "COMPLETED";
    targetValue: number | null;
    currentValue: number | null;
    unit: string | null;
    pointsAdjustment: { status: "PENDING" | "APPROVED" | "REJECTED"; amount: number; decidedAmount: number | null } | null;
  };
}) {
  const key =
    goal.status === "COMPLETED"
      ? "COMPLETED"
      : goal.pointsAdjustment?.status === "PENDING"
        ? "ACTIVE_PENDING"
        : goal.pointsAdjustment?.status === "REJECTED"
          ? "REJECTED"
          : null;
  const config = key ? STATUS_CONFIG[key] : null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{goal.title}</p>
        {goal.targetValue !== null && (
          <p className="text-xs text-slate-500">
            {goal.currentValue ?? 0} / {goal.targetValue} {goal.unit ?? ""}
          </p>
        )}
      </div>
      {config && (
        <span className={cn("flex shrink-0 items-center gap-1.5 text-xs font-medium", config.tone)}>
          <config.icon className="h-3.5 w-3.5" />
          {config.label}
          {goal.status === "COMPLETED" && ` (+${goal.pointsAdjustment?.amount} b.)`}
        </span>
      )}
    </div>
  );
}

export default async function MarketingStrategiaPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.role === "WORKER") {
    const [activeGoals, allGoals] = await Promise.all([
      getActiveGoals(user.id),
      getAllGoalsForUser(user.id),
    ]);

    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Marketingová stratégia</h1>
          <p className="text-sm text-slate-500">Tvoje ciele a smerovanie firmy</p>
        </div>

        <DirectionCard />

        <MarketingGoalCard goals={activeGoals} />

        {allGoals.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-600" />
                <CardTitle>História cieľov</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {allGoals.map((goal) => (
                <GoalHistoryRow key={goal.id} goal={goal} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const workers = await prisma.user.findMany({
    where: { role: "WORKER" },
    orderBy: { name: "asc" },
    include: { marketingGoals: { include: { pointsAdjustment: true }, orderBy: { createdAt: "desc" } } },
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Marketingová stratégia</h1>
        <p className="text-sm text-slate-500">Smerovanie firmy a ciele pracovníkov</p>
      </div>

      <DirectionCard />

      {workers.map((w) => (
        <Card key={w.id}>
          <CardHeader>
            <CardTitle>{w.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {w.marketingGoals.length === 0 ? (
              <EmptyState icon={Target} title="Zatiaľ žiadne ciele" />
            ) : (
              w.marketingGoals.map((goal) => <GoalHistoryRow key={goal.id} goal={goal} />)
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
