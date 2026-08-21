import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TaskForm } from "@/components/tasks/task-form";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const [profiles, workers] = await Promise.all([
    prisma.profile.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "WORKER", active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Nový Reel</h1>
        <p className="text-sm text-slate-500">Vytvorte novú úlohu pre pracovníka</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detaily úlohy</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm profiles={profiles} workers={workers} defaultProfileId={sp.profileId} defaultDate={sp.date} />
        </CardContent>
      </Card>
    </div>
  );
}
