import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { getDataDir } from "@/lib/paths";
import * as schema from "@/lib/db/schema";
import {
  contactMessages,
  notifications,
  orderFiles,
  orders,
  ticketMessages,
  tickets,
  users,
} from "@/lib/db/schema";

const DATA_DIR = getDataDir();
const DB_PATH = path.join(DATA_DIR, "liobiz.db");

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqliteHandle: Database.Database | null = null;

/** Close SQLite (required before backup restore). */
export function closeDb() {
  if (sqliteHandle) {
    try {
      sqliteHandle.close();
    } catch {
      // ignore
    }
  }
  sqliteHandle = null;
  dbInstance = null;
}

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
      blocked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT
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

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      service TEXT NOT NULL,
      description TEXT NOT NULL,
      budget TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      admin_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      uploaded_by INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'delivery',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      sender_role TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      href TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // Safe migrations for existing DBs
  const userCols = database.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>;
  const names = new Set(userCols.map((c) => c.name));
  if (!names.has("blocked")) {
    database.exec(`ALTER TABLE users ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0`);
  }
  if (!names.has("updated_at")) {
    database.exec(`ALTER TABLE users ADD COLUMN updated_at TEXT`);
  }
}

function seedAdmin(database: ReturnType<typeof drizzle<typeof schema>>) {
  const email = (process.env.ADMIN_EMAIL || "admin@liobiz.com").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "Admin@12345";
  const name = process.env.ADMIN_NAME || "مدیر لیوبیز";

  const existing = database.select().from(users).where(eq(users.email, email)).get();
  if (existing) return;

  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
    console.warn(
      "[liobiz] ADMIN_PASSWORD is not set. Seeding default admin — change it immediately after first login.",
    );
  }

  database
    .insert(users)
    .values({
      name,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role: "admin",
      phone: null,
      company: "لیوبیز",
      blocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
  sqliteHandle = sqlite;
  sqlite.pragma("journal_mode = WAL");
  ensureSchema(sqlite);
  dbInstance = drizzle(sqlite, { schema });
  seedAdmin(dbInstance);
  migrateContactJson(dbInstance);
  return dbInstance;
}

export function checkpointDb() {
  if (!sqliteHandle) {
    getDb();
  }
  sqliteHandle?.pragma("wal_checkpoint(TRUNCATE)");
}

export type {
  User,
  ContactMessage,
  Order,
  OrderFile,
  Ticket,
  TicketMessage,
  Notification,
} from "@/lib/db/schema";

export {
  users,
  contactMessages,
  orders,
  orderFiles,
  tickets,
  ticketMessages,
  notifications,
};
