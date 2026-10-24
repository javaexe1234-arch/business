export async function notifyTelegram(lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return { skipped: true, reason: "Telegram не настроен" };
  }

  const source = lead.source === "quiz" ? "ИИ-квиз" : "форма на сайте";
  const quizLines = lead.quiz
    ? Object.entries(lead.quiz)
        .map(([key, value]) => `• ${escapeHtml(label(key))}: ${escapeHtml(String(value))}`)
        .join("\n")
    : "";

  const text = [
    "<b>Новая заявка — Чертёж</b>",
    `Источник: ${source}`,
    `Имя: ${escapeHtml(lead.name)}`,
    `Телефон: ${escapeHtml(lead.phone)}`,
    lead.projectType ? `Проект: ${escapeHtml(lead.projectType)}` : "",
    lead.message ? `Комментарий: ${escapeHtml(lead.message)}` : "",
    quizLines ? `\nКвиз:\n${quizLines}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Telegram ${response.status}: ${details}`);
  }

  return { ok: true };
}

function label(key) {
  return (
    {
      siteType: "Тип сайта",
      scope: "Объём",
      deadline: "Сроки",
      budget: "Бюджет",
    }[key] || key
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
