const STUDIO_KNOWLEDGE = `
Ты — консультант веб-студии «Чертёж». Говоришь по-русски, коротко, по делу, без канцелярита.

Услуги:
- Лендинги под заявку: от 90 000 ₽, 10–18 дней.
- Корпоративные сайты: от 180 000 ₽, 3–6 недель.
- Интернет-магазины: от 280 000 ₽, 5–8 недель.
- Сопровождение после запуска: от 25 000 ₽ в месяц.

Что входит: прототип, дизайн, вёрстка, формы заявок, базовая SEO-разметка, адаптив, запуск.
Не обещай точную смету без брифа. Если не знаешь — скажи, что уточнит продюсер после заявки.

Задача: ответить на вопрос и мягко предложить следующий шаг квиза или заявку.
Не выдумывай кейсы, отзывы и скидки. Не проси паспорт, карты и пароли.
Один ответ — 2–5 предложений. В конце можно задать один уточняющий вопрос.
`;

export async function askGemini({ messages, quiz }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

  if (!apiKey) {
    return {
      text: fallbackReply(messages, quiz),
      fallback: true,
    };
  }

  const contents = (messages || [])
    .filter((item) => item.role === "user" || item.role === "assistant")
    .slice(-12)
    .map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: String(item.content || "") }],
    }));

  if (!contents.length) {
    contents.push({
      role: "user",
      parts: [{ text: "Посетитель открыл чат. Поприветствуй и предложи подобрать формат сайта." }],
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: `${STUDIO_KNOWLEDGE}\nТекущие ответы квиза: ${JSON.stringify(quiz || {})}`,
          },
        ],
      },
      contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 400,
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Gemini error", response.status, details);
    return { text: fallbackReply(messages, quiz), fallback: true };
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n").trim();
  return { text: text || fallbackReply(messages, quiz), fallback: !text };
}

function fallbackReply(messages, quiz) {
  const last = [...(messages || [])].reverse().find((item) => item.role === "user")?.content || "";
  const lower = last.toLowerCase();

  if (/цен|стоит|бюджет|руб/.test(lower)) {
    return "Ориентиры такие: лендинг от 90 000 ₽, корпоративный сайт от 180 000 ₽, магазин от 280 000 ₽. Точную смету собираем после брифа — давайте зафиксируем тип проекта в квизе.";
  }
  if (/срок|быстр|недел|дней/.test(lower)) {
    return "Лендинг обычно 10–18 дней, сайт компании 3–6 недель, магазин 5–8 недель. Если дедлайн жёсткий, напишите его в заявке — продюсер скажет, успеем ли.";
  }
  if (!quiz?.siteType) {
    return "Мы делаем лендинги, сайты компаний и магазины. Какой формат ближе к вашей задаче? Можно выбрать вариант в квизе справа от поля ввода.";
  }
  return "Могу подсказать по формату, срокам и составу работ. Если уже понятно, что нужно — оставьте имя и телефон, продюсер перезвонит в рабочий день.";
}
