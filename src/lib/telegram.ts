import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Best-effort Telegram sender. Silently no-ops when no bot token / chat id is
 * configured so the rest of the app keeps working without Telegram set up.
 */
export async function sendTelegramMessage(chatId: string | null | undefined, text: string) {
  try {
    const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
    const token = settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const targetChatId = chatId || process.env.TELEGRAM_WORKER_CHAT_ID;

    if (!token || !targetChatId) return { sent: false, reason: "not_configured" as const };

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    if (!res.ok) {
      return { sent: false, reason: "telegram_error" as const };
    }
    return { sent: true as const };
  } catch {
    return { sent: false, reason: "network_error" as const };
  }
}

export function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}${path}`;
}
