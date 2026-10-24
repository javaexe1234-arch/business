import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";

const statusLabel = {
  new: "новая",
  in_progress: "в работе",
  closed: "закрыта",
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [leads, setLeads] = useState([]);

  async function loadLeads() {
    const response = await fetch("/api/leads", { credentials: "include" });
    if (response.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await response.json();
    setLeads(data.leads || []);
    setAuthed(true);
  }

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" }).then((response) => {
      if (response.ok) {
        setAuthed(true);
        loadLeads();
      }
    });
  }, []);

  async function login(event) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Не удалось войти");
      return;
    }
    setPassword("");
    await loadLeads();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAuthed(false);
    setLeads([]);
  }

  async function setStatus(id, status) {
    const response = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) await loadLeads();
  }

  return (
    <>
      <Header compact />
      <main className="admin-shell">
        {!authed ? (
          <form className="admin-card" onSubmit={login} style={{ maxWidth: 420 }}>
            <h1>Вход в админку</h1>
            <label className="field">
              <span>Пароль</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <button className="btn btn-solid" type="submit">
              Войти
            </button>
            <p className="form-status error">{error}</p>
          </form>
        ) : (
          <>
            <div className="admin-toolbar">
              <h1>Заявки</h1>
              <button className="btn" type="button" onClick={logout}>
                Выйти
              </button>
            </div>
            <div className="admin-card" style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Имя</th>
                    <th>Телефон</th>
                    <th>Источник</th>
                    <th>Проект</th>
                    <th>Сообщение</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={7}>Пока пусто. Оставьте заявку на лендинге.</td>
                    </tr>
                  )}
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>{new Date(lead.createdAt).toLocaleString("ru-RU")}</td>
                      <td>{lead.name}</td>
                      <td>{lead.phone}</td>
                      <td>{lead.source === "quiz" ? "квиз" : "форма"}</td>
                      <td>{lead.projectType}</td>
                      <td>{lead.message}</td>
                      <td>
                        <select value={lead.status} onChange={(e) => setStatus(lead.id, e.target.value)}>
                          {Object.entries(statusLabel).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}
