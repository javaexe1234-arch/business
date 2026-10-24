export async function readJson(response) {
  const text = await response.text();
  if (!text) {
    throw new Error(
      response.status
        ? `Сервер вернул пустой ответ (${response.status}). Перезапустите npm run dev.`
        : "Сервер не ответил. Запустите npm run dev."
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Сервер вернул не JSON. Проверьте, что API на порту 3001 запущен.");
  }
}
