/**
 * Create or reset the default admin (full admin dashboard access).
 * Usage: node scripts/ensure-admin.mjs [path/to/liobiz.db]
 */
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";

const email = (process.env.ADMIN_EMAIL || "admin@liobiz.com").toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD || "Admin@12345";
const name = process.env.ADMIN_NAME || "مدیر لیوبیز";
const dbPath = process.argv[2] || path.join(process.cwd(), "data", "liobiz.db");

const db = new Database(dbPath);
const hash = bcrypt.hashSync(password, 10);
const now = new Date().toISOString();

const existing = db.prepare("SELECT id, role FROM users WHERE email = ?").get(email);

if (existing) {
  db.prepare(
    `UPDATE users SET
      name = ?,
      password_hash = ?,
      role = 'admin',
      blocked = 0,
      company = COALESCE(company, 'لیوبیز'),
      updated_at = ?
    WHERE email = ?`,
  ).run(name, hash, now, email);
  console.log(`Admin updated: ${email} (id=${existing.id})`);
} else {
  const result = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, phone, company, blocked, created_at, updated_at)
       VALUES (?, ?, ?, 'admin', NULL, 'لیوبیز', 0, ?, ?)`,
    )
    .run(name, email, hash, now, now);
  console.log(`Admin created: ${email} (id=${result.lastInsertRowid})`);
}

const row = db.prepare("SELECT id, email, role, blocked FROM users WHERE email = ?").get(email);
console.log("Verified:", row);
db.close();
