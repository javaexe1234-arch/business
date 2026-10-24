# Чертёж — лендинг веб-студии с ИИ-квизом

Продающий сайт студии: оффер, преимущества, отзывы, FAQ, форма заявки, ИИ-помощник на Gemini и админка `/admin`. Заявки сохраняются на сервере и дублируются в Telegram-группу.

## Запуск

```bash
npm install
copy .env.example .env
npm run dev
```

Клиент: http://localhost:5173  
API: http://127.0.0.1:3001  
Админка: http://localhost:5173/admin  

Пароль админки по умолчанию: значение `ADMIN_PASSWORD` в `.env`.

Прод:

```bash
npm run build
npm start
```

Сайт будет на `http://127.0.0.1:3001`.

## Переменные `.env`

| Ключ | Назначение |
| --- | --- |
| `ADMIN_PASSWORD` | Пароль входа в `/admin` |
| `SESSION_SECRET` | Подпись cookie-сессии |
| `GEMINI_API_KEY` | Ключ Gemini. Модель: `gemini-3.5-flash-lite` |
| `TELEGRAM_BOT_TOKEN` | Токен бота |
| `TELEGRAM_CHAT_ID` | ID группы, куда падают заявки |

Без ключа Gemini квиз всё равно собирает заявку, ответы идут из запасных фраз. Без Telegram заявка всё равно сохраняется в админке.

## Telegram-группа

1. Создайте бота в [@BotFather](https://t.me/BotFather), скопируйте токен в `TELEGRAM_BOT_TOKEN`.
2. Создайте группу для заявок и добавьте бота.
3. Напишите в группу любое сообщение, затем откройте в браузере  
   `https://api.telegram.org/bot<TOKEN>/getUpdates`  
   и возьмите `chat.id` (для групп часто отрицательное число).
4. Вставьте его в `TELEGRAM_CHAT_ID`.
