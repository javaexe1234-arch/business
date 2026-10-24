import { useState } from "react";

const initial = {
  name: "",
  phone: "",
  projectType: "Лендинг",
  message: "",
};

export default function LeadForm() {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [pending, setPending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setPending(true);
    setStatus({ type: "", text: "" });
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "form" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка отправки");
      setForm(initial);
      setStatus({ type: "ok", text: "Заявка ушла. Продюсер напишет в рабочий день." });
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    } finally {
      setPending(false);
    }
  }

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form className="lead-form" onSubmit={onSubmit}>
      <label className="field">
        <span>Имя</span>
        <input value={form.name} onChange={(e) => setField("name", e.target.value)} required minLength={2} />
      </label>
      <label className="field">
        <span>Телефон</span>
        <input value={form.phone} onChange={(e) => setField("phone", e.target.value)} required placeholder="+7 900 000-00-00" />
      </label>
      <label className="field">
        <span>Тип проекта</span>
        <select value={form.projectType} onChange={(e) => setField("projectType", e.target.value)}>
          <option>Лендинг</option>
          <option>Сайт компании</option>
          <option>Интернет-магазин</option>
          <option>Пока не знаю</option>
        </select>
      </label>
      <label className="field">
        <span>Комментарий</span>
        <textarea rows={4} value={form.message} onChange={(e) => setField("message", e.target.value)} />
      </label>
      <button className="btn btn-solid" type="submit" disabled={pending}>
        {pending ? "Отправляем…" : "Отправить заявку"}
      </button>
      <p className={`form-status ${status.type === "error" ? "error" : ""}`}>{status.text}</p>
    </form>
  );
}
