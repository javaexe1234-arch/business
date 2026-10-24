import { useEffect, useMemo, useState } from "react";

const STEPS = [
  {
    key: "siteType",
    prompt: "Какой сайт нужен?",
    options: ["Лендинг", "Сайт компании", "Интернет-магазин", "Пока не знаю"],
  },
  {
    key: "scope",
    prompt: "Какой объём ближе?",
    options: ["1–5 экранов", "До 10 страниц", "Каталог и корзина", "Нужна консультация"],
  },
  {
    key: "deadline",
    prompt: "Когда нужен запуск?",
    options: ["До 3 недель", "1–2 месяца", "Без жёсткого срока"],
  },
  {
    key: "budget",
    prompt: "Какой бюджет рассматриваете?",
    options: ["до 120 000 ₽", "120–250 000 ₽", "от 250 000 ₽"],
  },
];

const welcome =
  "Я помощник студии «Чертёж». Могу ответить по лендингам, сайтам компаний и магазинам. Можно писать свободным текстом или идти по квизу — в конце возьму контакт для продюсера.";

export default function QuizWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: welcome }]);
  const [quiz, setQuiz] = useState({});
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "" });
  const [done, setDone] = useState(false);

  const step = useMemo(() => STEPS.find((item) => !quiz[item.key]), [quiz]);

  useEffect(() => {
    const openQuiz = () => setOpen(true);
    window.addEventListener("open-quiz", openQuiz);
    return () => window.removeEventListener("open-quiz", openQuiz);
  }, []);

  async function askAssistant(nextMessages, nextQuiz = quiz) {
    setPending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, quiz: nextQuiz }),
      });
      const data = await response.json();
      const text = data.text || "Давайте продолжим квиз — так быстрее соберём заявку.";
      setMessages([...nextMessages, { role: "assistant", content: text }]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Связь с ИИ недоступна. Можете выбрать варианты квиза или оставить заявку в форме ниже." },
      ]);
    } finally {
      setPending(false);
    }
  }

  async function sendText(event) {
    event.preventDefault();
    const content = input.trim();
    if (!content || pending || done) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    await askAssistant(next);
  }

  async function choose(option) {
    if (!step || pending || done) return;
    const nextQuiz = { ...quiz, [step.key]: option };
    setQuiz(nextQuiz);
    const next = [...messages, { role: "user", content: option }];
    setMessages(next);
    await askAssistant(next, nextQuiz);
  }

  async function submitLead(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name,
          phone: contact.phone,
          projectType: quiz.siteType || "",
          message: `Квиз: ${JSON.stringify(quiz)}`,
          source: "quiz",
          quiz,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось отправить");
      setDone(true);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "Заявку получил. Продюсер свяжется в рабочий день." },
      ]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error.message }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button className="quiz-toggle" type="button" onClick={() => setOpen((value) => !value)}>
        {open ? "×" : "ИИ"}
      </button>
      {open && (
        <aside className="quiz-panel">
          <strong>Помощник Чертежа</strong>
          <div className="quiz-log">
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`bubble ${item.role}`}>
                {item.content}
              </div>
            ))}
          </div>
          {!done && step && (
            <>
              <p>{step.prompt}</p>
              <div className="quiz-options">
                {step.options.map((option) => (
                  <button key={option} type="button" onClick={() => choose(option)} disabled={pending}>
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
          {!done && !step && (
            <form onSubmit={submitLead}>
              <label className="field">
                <span>Имя</span>
                <input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} required />
              </label>
              <label className="field">
                <span>Телефон</span>
                <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} required />
              </label>
              <button className="btn btn-solid" type="submit" disabled={pending}>
                Отправить продюсеру
              </button>
            </form>
          )}
          <form className="quiz-compose" onSubmit={sendText}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={pending ? "Думаю…" : "Спросить своими словами"}
              disabled={pending || done}
            />
            <button className="btn" type="submit" disabled={pending || done}>
              →
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
