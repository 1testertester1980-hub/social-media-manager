import { Plus, Film } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ButtonLink } from "@/components/ui/button";
import { ContentFilters } from "@/components/tasks/content-filters";
import { ContentTable } from "@/components/tasks/content-table";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import type { Prisma, TaskStatus } from "@/generated/prisma";

const PAGE_SIZE = 20;

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; profileId?: string; status?: string; sort?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.ContentTaskWhereInput = {};
  if (sp.q) where.title = { contains: sp.q, mode: "insensitive" };
  if (sp.profileId) where.profileId = sp.profileId;
  if (sp.status) where.status = sp.status as TaskStatus;

  let orderBy: Prisma.ContentTaskOrderByWithRelationInput = { deadlineAt: "asc" };
  if (sp.sort === "deadline_desc") orderBy = { deadlineAt: "desc" };
  else if (sp.sort === "views_desc") orderBy = { analytics: { views: "desc" } };
  else if (sp.sort === "created_desc") orderBy = { createdAt: "desc" };

  const [rows, total, profiles] = await Promise.all([
    prisma.contentTask.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { profile: true, assignedUser: true, analytics: true },
    }),
    prisma.contentTask.count({ where }),
    prisma.profile.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.profileId) params.set("profileId", sp.profileId);
    if (sp.status) params.set("status", sp.status);
    if (sp.sort) params.set("sort", sp.sort);
    params.set("page", String(p));
    return `/content?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Content</h1>
          <p className="text-sm text-slate-500">Všetky Reely naprieč profilmi</p>
        </div>
        <ButtonLink href="/content/new">
          <Plus className="h-4 w-4" />
          Nový Reel
        </ButtonLink>
      </div>

      <ContentFilters profiles={profiles} current={sp} />

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState icon={Film} title="Žiadne Reely nenájdené" description="Skúste zmeniť filtre alebo vytvorte nový Reel." />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <ContentTable rows={rows} />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
          </div>
        </div>
      )}
    </div>
  );
}
