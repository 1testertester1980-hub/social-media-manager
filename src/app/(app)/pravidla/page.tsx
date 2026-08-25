import { Clock, Trophy, CheckCircle2, AlertTriangle, KeyRound, Gem } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { WEEKDAY_ROTATION, DAILY_DEADLINE_HOUR, DAILY_DEADLINE_MINUTE } from "@/lib/rotation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_LABELS: Record<number, string> = {
  1: "Pondelok",
  2: "Utorok",
  3: "Streda",
  4: "Štvrtok",
  5: "Piatok",
  6: "Sobota",
  0: "Nedeľa",
};

export default async function PravidlaPage() {
  const profiles = await prisma.profile.findMany();
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const deadline = `${String(DAILY_DEADLINE_HOUR).padStart(2, "0")}:${String(DAILY_DEADLINE_MINUTE).padStart(2, "0")}`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Pravidlá</h1>
        <p className="text-sm text-slate-500">Ako fungujú termíny a bodovanie</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600" />
            <CardTitle>Termín</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-slate-700">
            Každý deň máš naplánované <strong>2 Reely</strong> na 2 rôzne profily. Oba treba
            zverejniť do <strong>{deadline}</strong> (stredoeurópskeho času).
          </p>
          <p className="text-sm text-slate-500">
            Ktoré profily sú na rade, sa strieda podľa dňa v týždni:
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <tbody>
                {WEEKDAY_ORDER.map((day) => {
                  const [id1, id2] = WEEKDAY_ROTATION[day];
                  const p1 = profileById.get(id1);
                  const p2 = profileById.get(id2);
                  return (
                    <tr key={day} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-slate-700">{WEEKDAY_LABELS[day]}</td>
                      <td className="px-4 py-2.5 text-slate-600">
                        <div className="flex flex-wrap gap-3">
                          {[p1, p2].filter(Boolean).map((p) => (
                            <span key={p!.id} className="inline-flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p!.color }} />
                              {p!.name}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <CardTitle>Bodovanie</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-800">
              <strong>+3 body</strong> za každý Reel, ktorý zverejníš včas (pred termínom).
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-red-50 px-3 py-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-800">
              <strong>-3 body</strong> za každý Reel, ktorý sa nestihne zverejniť do termínu.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Svoj aktuálny počet bodov vidíš vždy v sekcii{" "}
            <span className="font-medium text-slate-700">Profil</span>.
          </p>
        </CardContent>
      </Card>

      <Card className="border-purple-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gem className="h-4 w-4 text-purple-500" />
            <CardTitle>Pupio — minimálne 1 Reel denne</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-slate-700">
            Pupio nemá pevný termín na jednotlivé Reely, takže nemôže byť &bdquo;po termíne&ldquo;. Platí ale
            jedno pravidlo: <strong>aspoň 1 Pupio Reel musíš zverejniť každý deň.</strong>
          </p>
          <div className="flex items-center gap-3 rounded-lg bg-red-50 px-3 py-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-800">
              Od <strong>26. 8. 2026</strong>: ak za daný deň nezverejníš ani jeden Pupio Reel,
              strhnú sa ti <strong>-3 body</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-slate-500" />
            <CardTitle>Ak sa nestíhaš</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">
            Keď úloha prejde do stavu <strong>Po termíne</strong>, tlačidlo na zverejnenie
            zmizne a body sa strhnú. Ak máš dobrý dôvod (napr. sa ti niečo stalo), napíš
            administrátorovi — vie ti pre danú úlohu jednorazovo povoliť, aby si ju stále mohol
            označiť ako zverejnenú.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
