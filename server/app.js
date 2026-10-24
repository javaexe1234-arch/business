import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { checkPassword, clearSession, requireAdmin, setSession } from "./auth.js";
import { askGemini } from "./gemini.js";
import { createLead, listLeads, updateLeadStatus } from "./leadsStore.js";
import { notifyTelegram } from "./telegram.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const isProd = process.env.NODE_ENV === "production";
const dist = path.join(__dirname, "../dist");

app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
if (!isProd) {
  app.use(cors({ origin: "http://localhost:5173", credentials: true }));
}

app.post("/api/leads", async (req, res) => {
  try {
    const lead = validateLead(req.body);
    const saved = await createLead(lead);
    try {
      const telegram = await notifyTelegram(saved);
      if (telegram?.skipped) {
        console.warn("Telegram skipped:", telegram.reason);
      }
    } catch (error) {
      console.error("Telegram notify failed", error.message);
    }
    res.status(201).json({ id: saved.id, ok: true });
  } catch (error) {
    if (error.code === "VALIDATION") {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === "TURSO_CONFIG") {
      return res.status(503).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: "Не удалось сохранить заявку" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const quiz = req.body?.quiz && typeof req.body.quiz === "object" ? req.body.quiz : {};
    const result = await askGemini({ messages, quiz });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ИИ сейчас недоступен, оставьте заявку в форме." });
  }
});

app.post("/api/admin/login", (req, res) => {
  if (!checkPassword(req.body?.password)) {
    return res.status(401).json({ error: "Неверный пароль" });
  }
  setSession(res);
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

app.get("/api/admin/me", requireAdmin, (req, res) => {
  res.json({ ok: true });
});

app.get("/api/leads", requireAdmin, async (req, res) => {
  try {
    const leads = await listLeads();
    res.json({ leads });
  } catch (error) {
    if (error.code === "TURSO_CONFIG") {
      return res.status(503).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: "Не удалось загрузить заявки" });
  }
});

app.patch("/api/leads/:id", requireAdmin, async (req, res) => {
  try {
    const updated = await updateLeadStatus(req.params.id, req.body?.status);
    if (!updated) return res.status(404).json({ error: "Заявка не найдена" });
    res.json({ lead: updated });
  } catch (error) {
    if (error.message === "INVALID_STATUS") {
      return res.status(400).json({ error: "Некорректный статус" });
    }
    if (error.code === "TURSO_CONFIG") {
      return res.status(503).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: "Не удалось обновить заявку" });
  }
});

if (isProd) {
  app.use(express.static(dist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}

function validateLead(body = {}) {
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const projectType = String(body.projectType || "").trim();
  const message = String(body.message || "").trim();
  const source = body.source === "quiz" ? "quiz" : "form";

  if (name.length < 2) {
    const error = new Error("Укажите имя");
    error.code = "VALIDATION";
    throw error;
  }
  if (!/^[\d+\-\s()]{7,20}$/.test(phone)) {
    const error = new Error("Укажите телефон");
    error.code = "VALIDATION";
    throw error;
  }

  return {
    name: name.slice(0, 80),
    phone: phone.slice(0, 20),
    projectType: projectType.slice(0, 80),
    message: message.slice(0, 1000),
    source,
    quiz: body.quiz && typeof body.quiz === "object" ? body.quiz : null,
  };
}

export default app;
