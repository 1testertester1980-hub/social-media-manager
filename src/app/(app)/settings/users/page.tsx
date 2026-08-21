import { prisma } from "@/lib/prisma";
import { UserFormDialog } from "@/components/settings/user-form-dialog";
import { Badge } from "@/components/ui/badge";

export default async function UsersSettingsPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Používatelia</h1>
          <p className="text-sm text-slate-500">Správa administrátorov a pracovníkov</p>
        </div>
        <UserFormDialog />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Meno</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Rola</th>
              <th className="px-5 py-3">Stav</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 font-medium text-slate-900">{u.name}</td>
                <td className="px-5 py-3 text-slate-600">{u.email}</td>
                <td className="px-5 py-3">
                  <Badge>{u.role === "ADMIN" ? "Admin" : "Worker"}</Badge>
                </td>
                <td className="px-5 py-3">
                  <span className={u.active ? "text-emerald-600" : "text-slate-400"}>
                    {u.active ? "Aktívny" : "Neaktívny"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <UserFormDialog
                    mode="edit"
                    user={u}
                    trigger={
                      <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
                        Upraviť
                      </button>
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
