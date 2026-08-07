import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "client"] }).notNull().default("client"),
  phone: text("phone"),
  company: text("company"),
  blocked: integer("blocked", { mode: "boolean" }).notNull().default(false),
  blockReason: text("block_reason"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
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

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  service: text("service").notNull(),
  description: text("description").notNull(),
  budget: text("budget"),
  status: text("status", {
    enum: ["new", "review", "in_progress", "completed", "cancelled"],
  })
    .notNull()
    .default("new"),
  adminNote: text("admin_note"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const orderFiles = sqliteTable("order_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  kind: text("kind", { enum: ["request", "delivery"] }).notNull().default("delivery"),
  createdAt: text("created_at").notNull(),
});

export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  orderId: integer("order_id"),
  subject: text("subject").notNull(),
  status: text("status", { enum: ["open", "answered", "closed"] }).notNull().default("open"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const ticketMessages = sqliteTable("ticket_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id").notNull(),
  senderId: integer("sender_id").notNull(),
  senderRole: text("sender_role", { enum: ["admin", "client"] }).notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  href: text("href"),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderFile = typeof orderFiles.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
