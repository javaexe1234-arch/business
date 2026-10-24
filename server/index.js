import app from "./app.js";

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  console.log(`Server http://127.0.0.1:${port}`);
  console.log(
    "Telegram:",
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
      ? `группа ${process.env.TELEGRAM_CHAT_ID}`
      : "не настроен (проверьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env)"
  );
  console.log(
    "Turso:",
    process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
      ? "заявки в облачной SQLite"
      : "не настроен (укажите TURSO_DATABASE_URL и TURSO_AUTH_TOKEN)"
  );
});
