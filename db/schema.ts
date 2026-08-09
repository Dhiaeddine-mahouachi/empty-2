import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  templateId: text("template_id").notNull(),
  language: text("language").notNull().default("tr"),
  businessName: text("business_name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  primaryColor: text("primary_color").notNull().default("#a3ff12"),
  phone: text("phone").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  email: text("email").notNull(),
  address: text("address").notNull().default(""),
  contactName: text("contact_name").notNull(),
  offersJson: text("offers_json").notNull().default("[]"),
  detailsJson: text("details_json").notNull().default("{}"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  status: text("status").notNull().default("pending"),
  ownerNote: text("owner_note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  approvedAt: text("approved_at"),
  revision: integer("revision").notNull().default(1),
});
