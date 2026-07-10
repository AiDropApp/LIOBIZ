import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "client"] }).notNull().default("client"),
  phone: text("phone"),
  company: text("company"),
  createdAt: text("created_at").notNull(),
});

export const contactMessages = sqliteTable("contact_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["new", "read", "closed"] }).notNull().default("new"),
  createdAt: text("created_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
