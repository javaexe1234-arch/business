import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
const file = path.join(dir, "leads.json");

let client;
let ready;
let queue = Promise.resolve();

function isTursoConfigured() {
  const url = String(process.env.TURSO_DATABASE_URL || "").trim();
  const token = String(process.env.TURSO_AUTH_TOKEN || "").trim();
  return Boolean(url && token && !url.includes("your-db-name"));
}

function withLock(fn) {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function getClient() {
  if (client) return client;
  client = createClient({
    url: process.env.TURSO_DATABASE_URL.trim(),
    authToken: process.env.TURSO_AUTH_TOKEN.trim(),
  });
  return client;
}

function ensureSchema() {
  if (!ready) {
    ready = getClient().execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        project_type TEXT,
        message TEXT,
        source TEXT NOT NULL,
        quiz TEXT
      )
    `);
  }
  return ready;
}

function rowToLead(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    name: row.name,
    phone: row.phone,
    projectType: row.project_type || "",
    message: row.message || "",
    source: row.source,
    quiz: row.quiz ? JSON.parse(row.quiz) : null,
  };
}

function buildLead(payload) {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "new",
    name: String(payload.name || "").trim(),
    phone: String(payload.phone || "").trim(),
    projectType: String(payload.projectType || "").trim(),
    message: String(payload.message || "").trim(),
    source: payload.source === "quiz" ? "quiz" : "form",
    quiz: payload.quiz || null,
  };
}

async function readLocalLeads() {
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocalLeads(leads) {
  await mkdir(dir, { recursive: true });
  await writeFile(file, JSON.stringify(leads, null, 2), "utf8");
}

export async function listLeads() {
  if (!isTursoConfigured()) {
    return withLock(readLocalLeads);
  }
  await ensureSchema();
  const result = await getClient().execute("SELECT * FROM leads ORDER BY created_at DESC");
  return result.rows.map(rowToLead);
}

export async function createLead(payload) {
  const lead = buildLead(payload);
  if (!isTursoConfigured()) {
    console.warn("Turso не настроен — заявка сохранена локально в server/data/leads.json");
    return withLock(async () => {
      const leads = await readLocalLeads();
      leads.unshift(lead);
      await writeLocalLeads(leads);
      return lead;
    });
  }

  await ensureSchema();
  await getClient().execute({
    sql: `INSERT INTO leads (id, created_at, status, name, phone, project_type, message, source, quiz)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      lead.id,
      lead.createdAt,
      lead.status,
      lead.name,
      lead.phone,
      lead.projectType,
      lead.message,
      lead.source,
      lead.quiz ? JSON.stringify(lead.quiz) : null,
    ],
  });
  return lead;
}

export async function updateLeadStatus(id, status) {
  const allowed = new Set(["new", "in_progress", "closed"]);
  if (!allowed.has(status)) {
    throw new Error("INVALID_STATUS");
  }

  if (!isTursoConfigured()) {
    return withLock(async () => {
      const leads = await readLocalLeads();
      const index = leads.findIndex((item) => item.id === id);
      if (index === -1) return null;
      leads[index] = { ...leads[index], status };
      await writeLocalLeads(leads);
      return leads[index];
    });
  }

  await ensureSchema();
  const result = await getClient().execute({
    sql: "UPDATE leads SET status = ? WHERE id = ?",
    args: [status, id],
  });
  if (!result.rowsAffected) return null;

  const found = await getClient().execute({
    sql: "SELECT * FROM leads WHERE id = ?",
    args: [id],
  });
  return found.rows[0] ? rowToLead(found.rows[0]) : null;
}
