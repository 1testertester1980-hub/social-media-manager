import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AccountForm } from "@/components/account/account-form";

export default async function AccountPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Môj profil</h1>
        <p className="text-sm text-slate-500">{user.name} · {user.email}</p>
      </div>
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
