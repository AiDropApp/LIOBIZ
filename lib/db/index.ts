import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import * as schema from "@/lib/db/schema";
import { contactMessages, users } from "@/lib/db/schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "liobiz.db");

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function ensureSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      phone TEXT,
      company TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL
    );
  `);
}

function seedAdmin(database: ReturnType<typeof drizzle<typeof schema>>) {
  const existing = database.select().from(users).where(eq(users.email, "admin@liobiz.com")).get();
  if (existing) return;

  database
    .insert(users)
    .values({
      name: "مدیر لیوبیز",
      email: "admin@liobiz.com",
      passwordHash: bcrypt.hashSync("Admin@12345", 10),
      role: "admin",
      phone: null,
      company: "لیوبیز",
      createdAt: new Date().toISOString(),
    })
    .run();
}

function migrateContactJson(database: ReturnType<typeof drizzle<typeof schema>>) {
  const jsonPath = path.join(DATA_DIR, "contact-messages.json");
  if (!fs.existsSync(jsonPath)) return;

  try {
    const raw = fs.readFileSync(jsonPath, "utf8");
    const list = JSON.parse(raw) as Array<{
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
      createdAt?: string;
    }>;
    if (!Array.isArray(list) || list.length === 0) return;

    const count = database.select().from(contactMessages).all().length;
    if (count > 0) return;

    for (const item of list) {
      if (!item.name || !item.email || !item.phone || !item.message) continue;
      database
        .insert(contactMessages)
        .values({
          name: item.name,
          email: item.email,
          phone: item.phone,
          message: item.message,
          status: "new",
          createdAt: item.createdAt || new Date().toISOString(),
        })
        .run();
    }
  } catch {
    // ignore corrupt json
  }
}

export function getDb() {
  if (dbInstance) return dbInstance;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  ensureSchema(sqlite);
  dbInstance = drizzle(sqlite, { schema });
  seedAdmin(dbInstance);
  migrateContactJson(dbInstance);
  return dbInstance;
}

export type { User, ContactMessage } from "@/lib/db/schema";
export { users, contactMessages };
