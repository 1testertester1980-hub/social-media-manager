import Link from "next/link";
import { Users, MessageCircle } from "lucide-react";
import { getAppSettings } from "@/actions/settings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AppSettingsForm } from "@/components/settings/app-settings-form";

export default async function SettingsPage() {
  const settings = await getAppSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Nastavenia</h1>
        <p className="text-sm text-slate-500">Konfigurácia aplikácie</p>
      </div>

      <Link
        href="/settings/users"
        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-200 hover:bg-indigo-50/30"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Používatelia</p>
          <p className="text-xs text-slate-500">Správa administrátorov a pracovníkov</p>
        </div>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-slate-400" />
            <CardTitle>Telegram notifikácie</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <AppSettingsForm telegramBotToken={settings.telegramBotToken} timezone={settings.timezone} />
        </CardContent>
      </Card>
    </div>
  );
}
