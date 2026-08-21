import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ProfileFormDialog } from "@/components/profiles/profile-form-dialog";
import { ToggleActiveButton } from "@/components/profiles/toggle-active-button";
import { Camera } from "lucide-react";
import { monthRange } from "@/lib/queries";

export default async function ProfilesPage() {
  const now = new Date();
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);

  const profiles = await prisma.profile.findMany({
    orderBy: { name: "asc" },
    include: {
      tasks: {
        where: { deadlineAt: { gte: start, lt: end } },
        include: { analytics: true },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Profily</h1>
          <p className="text-sm text-slate-500">Správa Instagram profilov</p>
        </div>
        <ProfileFormDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => {
          const published = profile.tasks.filter((t) => t.status === "PUBLISHED").length;
          const views = profile.tasks.reduce((s, t) => s + (t.analytics?.views ?? 0), 0);

          return (
            <div key={profile.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                {profile.imageUrl ? (
                  <Image
                    src={profile.imageUrl}
                    alt={profile.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: profile.color }}
                  >
                    <Camera className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <Link href={`/profiles/${profile.id}`} className="truncate font-medium text-slate-900 hover:text-indigo-600">
                    {profile.name}
                  </Link>
                  {profile.instagramUsername && (
                    <p className="truncate text-xs text-slate-500">{profile.instagramUsername}</p>
                  )}
                </div>
                {!profile.active && (
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    Neaktívny
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="text-lg font-semibold text-slate-900">{published}</p>
                  <p className="text-[11px] text-slate-500">zverejnené tento mesiac</p>
                </div>
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="text-lg font-semibold text-slate-900">{views.toLocaleString("sk-SK")}</p>
                  <p className="text-[11px] text-slate-500">zhliadnutia</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link href={`/profiles/${profile.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                  Zobraziť výkonnosť
                </Link>
                <div className="flex gap-2">
                  <ProfileFormDialog
                    mode="edit"
                    profile={profile}
                    trigger={
                      <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
                        Upraviť
                      </button>
                    }
                  />
                  <ToggleActiveButton profileId={profile.id} active={profile.active} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
