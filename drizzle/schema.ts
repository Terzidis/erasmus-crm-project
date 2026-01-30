import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with CRM-specific fields for role-based access control.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatar: text("avatar"),
  phone: varchar("phone", { length: 32 }),
  department: varchar("department", { length: 128 }),
  // Email notification preferences
  emailNotifyNewDeal: boolean("emailNotifyNewDeal").default(true).notNull(),
  emailNotifyDealWon: boolean("emailNotifyDealWon").default(true).notNull(),
  emailNotifyDealLost: boolean("emailNotifyDealLost").default(true).notNull(),
  emailNotifyOverdue: boolean("emailNotifyOverdue").default(true).notNull(),
  emailNotifyActivityDue: boolean("emailNotifyActivityDue").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Companies table for organization management
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 128 }),
  website: varchar("website", { length: 512 }),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  country: varchar("country", { length: 128 }),
  employeeCount: int("employeeCount"),
  annualRevenue: decimal("annualRevenue", { precision: 15, scale: 2 }),
  description: text("description"),
  logo: text("logo"),
  ownerId: int("ownerId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Contacts table for customer/lead management
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  mobile: varchar("mobile", { length: 32 }),
  jobTitle: varchar("jobTitle", { length: 128 }),
  department: varchar("department", { length: 128 }),
  companyId: int("companyId").references(() => companies.id),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  country: varchar("country", { length: 128 }),
  linkedIn: varchar("linkedIn", { length: 512 }),
  twitter: varchar("twitter", { length: 256 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["lead", "prospect", "customer", "inactive"]).default("lead").notNull(),
  source: varchar("source", { length: 128 }),
  avatar: text("avatar"),
  ownerId: int("ownerId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Deals/Opportunities pipeline table
 */
export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  stage: mysqlEnum("stage", ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]).default("lead").notNull(),
  probability: int("probability").default(0),
  expectedCloseDate: timestamp("expectedCloseDate"),
  actualCloseDate: timestamp("actualCloseDate"),
  contactId: int("contactId").references(() => contacts.id),
  companyId: int("companyId").references(() => companies.id),
  ownerId: int("ownerId").references(() => users.id),
  description: text("description"),
  lostReason: text("lostReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

/**
 * Activities table for tracking interactions
 */
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["call", "email", "meeting", "task", "note"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  isCompleted: boolean("isCompleted").default(false),
  contactId: int("contactId").references(() => contacts.id),
  companyId: int("companyId").references(() => companies.id),
  dealId: int("dealId").references(() => deals.id),
  ownerId: int("ownerId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

/**
 * Tags for categorizing contacts, companies, and deals
 */
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Contact-Tag relationship table
 */
export const contactTags = mysqlTable("contact_tags", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").references(() => contacts.id).notNull(),
  tagId: int("tagId").references(() => tags.id).notNull(),
});

export type ContactTag = typeof contactTags.$inferSelect;
export type InsertContactTag = typeof contactTags.$inferInsert;

/**
 * Notifications table for real-time alerts
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  type: mysqlEnum("type", ["new_deal", "deal_won", "deal_lost", "activity_due", "activity_overdue", "contact_added", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  link: varchar("link", { length: 512 }),
  isRead: boolean("isRead").default(false).notNull(),
  relatedDealId: int("relatedDealId").references(() => deals.id),
  relatedActivityId: int("relatedActivityId").references(() => activities.id),
  relatedContactId: int("relatedContactId").references(() => contacts.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
