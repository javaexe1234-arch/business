import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
const file = path.join(dir, "leads.json");

let queue = Promise.resolve();

async function readLeads() {
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeLeads(leads) {
  await mkdir(dir, { recursive: true });
  await writeFile(file, JSON.stringify(leads, null, 2), "utf8");
}

function withLock(fn) {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export function listLeads() {
  return withLock(readLeads);
}

export function createLead(payload) {
  return withLock(async () => {
    const leads = await readLeads();
    const lead = {
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
    leads.unshift(lead);
    await writeLeads(leads);
    return lead;
  });
}

export function updateLeadStatus(id, status) {
  const allowed = new Set(["new", "in_progress", "closed"]);
  if (!allowed.has(status)) {
    throw new Error("INVALID_STATUS");
  }

  return withLock(async () => {
    const leads = await readLeads();
    const index = leads.findIndex((item) => item.id === id);
    if (index === -1) return null;
    leads[index] = { ...leads[index], status };
    await writeLeads(leads);
    return leads[index];
  });
}
