import { eq, desc, asc, sql, and, like, or, count, gte, lte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  InsertContact, contacts, 
  InsertCompany, companies,
  InsertDeal, deals,
  InsertActivity, activities,
  InsertTag, tags,
  contactTags,
  notifications,
  InsertNotification
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER OPERATIONS ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "avatar", "phone", "department"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export interface EmailNotificationPreferences {
  emailNotifyNewDeal?: boolean;
  emailNotifyDealWon?: boolean;
  emailNotifyDealLost?: boolean;
  emailNotifyOverdue?: boolean;
  emailNotifyActivityDue?: boolean;
}

export async function updateUserEmailPreferences(userId: number, preferences: EmailNotificationPreferences) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(preferences).where(eq(users.id, userId));
}

export async function getUserEmailPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    emailNotifyNewDeal: users.emailNotifyNewDeal,
    emailNotifyDealWon: users.emailNotifyDealWon,
    emailNotifyDealLost: users.emailNotifyDealLost,
    emailNotifyOverdue: users.emailNotifyOverdue,
    emailNotifyActivityDue: users.emailNotifyActivityDue,
  }).from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ==================== CONTACT OPERATIONS ====================

export async function createContact(contact: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contacts).values(contact);
  return { id: result[0].insertId };
}

export async function updateContact(id: number, contact: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contacts).set(contact).where(eq(contacts.id, id));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contacts).where(eq(contacts.id, id));
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllContacts(options?: { 
  limit?: number; 
  offset?: number; 
  search?: string;
  status?: string;
  statuses?: string[];
  sources?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  ownerId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(contacts);
  const conditions = [];
  
  if (options?.search) {
    conditions.push(
      or(
        like(contacts.firstName, `%${options.search}%`),
        like(contacts.lastName, `%${options.search}%`),
        like(contacts.email, `%${options.search}%`)
      )
    );
  }
  
  // Single status filter (backward compatibility)
  if (options?.status) {
    conditions.push(eq(contacts.status, options.status as any));
  }
  
  // Multi-select status filter
  if (options?.statuses && options.statuses.length > 0) {
    conditions.push(inArray(contacts.status, options.statuses as any));
  }
  
  // Multi-select source filter
  if (options?.sources && options.sources.length > 0) {
    conditions.push(inArray(contacts.source, options.sources));
  }
  
  // Date range filter
  if (options?.dateFrom) {
    conditions.push(gte(contacts.createdAt, options.dateFrom));
  }
  if (options?.dateTo) {
    conditions.push(lte(contacts.createdAt, options.dateTo));
  }
  
  if (options?.ownerId) {
    conditions.push(eq(contacts.ownerId, options.ownerId));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query
    .orderBy(desc(contacts.createdAt))
    .limit(options?.limit ?? 100)
    .offset(options?.offset ?? 0);
}

export async function getContactsCount(options?: { status?: string; ownerId?: number }) {
  const db = await getDb();
  if (!db) return 0;
  
  const conditions = [];
  if (options?.status) {
    conditions.push(eq(contacts.status, options.status as any));
  }
  if (options?.ownerId) {
    conditions.push(eq(contacts.ownerId, options.ownerId));
  }
  
  let query = db.select({ count: count() }).from(contacts);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const result = await query;
  return result[0]?.count ?? 0;
}

// ==================== COMPANY OPERATIONS ====================

export async function createCompany(company: InsertCompany) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(companies).values(company);
  return { id: result[0].insertId };
}

export async function updateCompany(id: number, company: Partial<InsertCompany>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(companies).set(company).where(eq(companies.id, id));
}

export async function deleteCompany(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(companies).where(eq(companies.id, id));
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCompanies(options?: { 
  limit?: number; 
  offset?: number; 
  search?: string;
  ownerId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(companies);
  const conditions = [];
  
  if (options?.search) {
    conditions.push(
      or(
        like(companies.name, `%${options.search}%`),
        like(companies.industry, `%${options.search}%`)
      )
    );
  }
  
  if (options?.ownerId) {
    conditions.push(eq(companies.ownerId, options.ownerId));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query
    .orderBy(desc(companies.createdAt))
    .limit(options?.limit ?? 100)
    .offset(options?.offset ?? 0);
}

export async function getCompaniesCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(companies);
  return result[0]?.count ?? 0;
}

// ==================== DEAL OPERATIONS ====================

export async function createDeal(deal: InsertDeal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deals).values(deal);
  return { id: result[0].insertId };
}

export async function updateDeal(id: number, deal: Partial<InsertDeal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deals).set(deal).where(eq(deals.id, id));
}

export async function deleteDeal(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Clear foreign key references before deleting the deal
  // Update notifications to remove deal reference
  await db.update(notifications).set({ relatedDealId: null }).where(eq(notifications.relatedDealId, id));
  
  // Update activities to remove deal reference
  await db.update(activities).set({ dealId: null }).where(eq(activities.dealId, id));
  
  // Now delete the deal
  await db.delete(deals).where(eq(deals.id, id));
}

export async function getDealById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllDeals(options?: { 
  limit?: number; 
  offset?: number; 
  stage?: string;
  stages?: string[];
  valueMin?: number;
  valueMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  ownerId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(deals);
  const conditions = [];
  
  // Single stage filter (backward compatibility)
  if (options?.stage) {
    conditions.push(eq(deals.stage, options.stage as any));
  }
  
  // Multi-select stage filter
  if (options?.stages && options.stages.length > 0) {
    conditions.push(inArray(deals.stage, options.stages as any));
  }
  
  // Value range filter
  if (options?.valueMin !== undefined) {
    conditions.push(gte(deals.value, options.valueMin.toString()));
  }
  if (options?.valueMax !== undefined) {
    conditions.push(lte(deals.value, options.valueMax.toString()));
  }
  
  // Date range filter
  if (options?.dateFrom) {
    conditions.push(gte(deals.createdAt, options.dateFrom));
  }
  if (options?.dateTo) {
    conditions.push(lte(deals.createdAt, options.dateTo));
  }
  
  if (options?.ownerId) {
    conditions.push(eq(deals.ownerId, options.ownerId));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query
    .orderBy(desc(deals.createdAt))
    .limit(options?.limit ?? 100)
    .offset(options?.offset ?? 0);
}

export async function getDealsCount(options?: { stage?: string }) {
  const db = await getDb();
  if (!db) return 0;
  
  let query = db.select({ count: count() }).from(deals);
  if (options?.stage) {
    query = query.where(eq(deals.stage, options.stage as any)) as any;
  }
  
  const result = await query;
  return result[0]?.count ?? 0;
}

export async function getDealsPipelineStats() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      stage: deals.stage,
      count: count(),
      totalValue: sql<string>`COALESCE(SUM(${deals.value}), 0)`,
    })
    .from(deals)
    .groupBy(deals.stage);
  
  return result;
}

// ==================== ACTIVITY OPERATIONS ====================

export async function createActivity(activity: InsertActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(activities).values(activity);
  return { id: result[0].insertId };
}

export async function updateActivity(id: number, activity: Partial<InsertActivity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(activities).set(activity).where(eq(activities.id, id));
}

export async function deleteActivity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(activities).where(eq(activities.id, id));
}

export async function getActivityById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllActivities(options?: { 
  limit?: number; 
  offset?: number; 
  type?: string;
  types?: string[];
  contactId?: number;
  companyId?: number;
  dealId?: number;
  ownerId?: number;
  isCompleted?: boolean;
  status?: "pending" | "completed" | "overdue";
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(activities);
  const conditions = [];
  
  // Single type filter (backward compatibility)
  if (options?.type) {
    conditions.push(eq(activities.type, options.type as any));
  }
  
  // Multi-select type filter
  if (options?.types && options.types.length > 0) {
    conditions.push(inArray(activities.type, options.types as any));
  }
  
  if (options?.contactId) {
    conditions.push(eq(activities.contactId, options.contactId));
  }
  if (options?.companyId) {
    conditions.push(eq(activities.companyId, options.companyId));
  }
  if (options?.dealId) {
    conditions.push(eq(activities.dealId, options.dealId));
  }
  if (options?.ownerId) {
    conditions.push(eq(activities.ownerId, options.ownerId));
  }
  if (options?.isCompleted !== undefined) {
    conditions.push(eq(activities.isCompleted, options.isCompleted));
  }
  
  // Status filter (pending, completed, overdue)
  if (options?.status) {
    const now = new Date();
    if (options.status === "completed") {
      conditions.push(eq(activities.isCompleted, true));
    } else if (options.status === "pending") {
      conditions.push(eq(activities.isCompleted, false));
      conditions.push(gte(activities.dueDate, now));
    } else if (options.status === "overdue") {
      conditions.push(eq(activities.isCompleted, false));
      conditions.push(lte(activities.dueDate, now));
    }
  }
  
  // Date range filter (on due date)
  if (options?.dateFrom) {
    conditions.push(gte(activities.dueDate, options.dateFrom));
  }
  if (options?.dateTo) {
    conditions.push(lte(activities.dueDate, options.dateTo));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query
    .orderBy(desc(activities.createdAt))
    .limit(options?.limit ?? 100)
    .offset(options?.offset ?? 0);
}

export async function getActivitiesCount(options?: { isCompleted?: boolean }) {
  const db = await getDb();
  if (!db) return 0;
  
  let query = db.select({ count: count() }).from(activities);
  if (options?.isCompleted !== undefined) {
    query = query.where(eq(activities.isCompleted, options.isCompleted)) as any;
  }
  
  const result = await query;
  return result[0]?.count ?? 0;
}

export async function getRecentActivities(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit);
}

// ==================== TAG OPERATIONS ====================

export async function createTag(tag: InsertTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tags).values(tag);
  return { id: result[0].insertId };
}

export async function getAllTags() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tags).orderBy(asc(tags.name));
}

export async function deleteTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contactTags).where(eq(contactTags.tagId, id));
  await db.delete(tags).where(eq(tags.id, id));
}

// ==================== DASHBOARD STATS ====================

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return {
    totalContacts: 0,
    totalCompanies: 0,
    totalDeals: 0,
    openActivities: 0,
    pipelineValue: "0",
    wonDealsValue: "0",
  };
  
  const [contactsResult, companiesResult, dealsResult, activitiesResult, pipelineResult, wonResult] = await Promise.all([
    db.select({ count: count() }).from(contacts),
    db.select({ count: count() }).from(companies),
    db.select({ count: count() }).from(deals),
    db.select({ count: count() }).from(activities).where(eq(activities.isCompleted, false)),
    db.select({ total: sql<string>`COALESCE(SUM(${deals.value}), 0)` }).from(deals).where(
      and(
        sql`${deals.stage} != 'closed_lost'`,
        sql`${deals.stage} != 'closed_won'`
      )
    ),
    db.select({ total: sql<string>`COALESCE(SUM(${deals.value}), 0)` }).from(deals).where(eq(deals.stage, "closed_won")),
  ]);
  
  return {
    totalContacts: contactsResult[0]?.count ?? 0,
    totalCompanies: companiesResult[0]?.count ?? 0,
    totalDeals: dealsResult[0]?.count ?? 0,
    openActivities: activitiesResult[0]?.count ?? 0,
    pipelineValue: pipelineResult[0]?.total ?? "0",
    wonDealsValue: wonResult[0]?.total ?? "0",
  };
}

export async function getContactsByStatus() {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select({
      status: contacts.status,
      count: count(),
    })
    .from(contacts)
    .groupBy(contacts.status);
}

export async function getActivitiesByType() {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select({
      type: activities.type,
      count: count(),
    })
    .from(activities)
    .groupBy(activities.type);
}


// ==================== NOTIFICATION OPERATIONS ====================

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(notification);
  return { id: result[0].insertId };
}

export async function getUserNotifications(userId: number, options?: { limit?: number; unreadOnly?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(notifications.userId, userId)];
  if (options?.unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }
  
  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(options?.limit ?? 50);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  
  return result[0]?.count ?? 0;
}

export async function markNotificationAsRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function deleteNotification(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function getUpcomingActivities(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  
  return db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.ownerId, userId),
        eq(activities.isCompleted, false),
        sql`${activities.dueDate} IS NOT NULL`,
        sql`${activities.dueDate} <= ${tomorrow}`
      )
    )
    .orderBy(asc(activities.dueDate))
    .limit(20);
}

export async function getOverdueActivities(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  
  return db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.ownerId, userId),
        eq(activities.isCompleted, false),
        sql`${activities.dueDate} IS NOT NULL`,
        sql`${activities.dueDate} < ${now}`
      )
    )
    .orderBy(asc(activities.dueDate))
    .limit(20);
}

export async function createNotificationsForAllUsers(
  notificationData: Omit<InsertNotification, "userId">,
  excludeUserId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allUsers = await db.select({ id: users.id }).from(users);
  const notificationsToInsert = allUsers
    .filter(u => u.id !== excludeUserId)
    .map(u => ({ ...notificationData, userId: u.id }));
  
  if (notificationsToInsert.length > 0) {
    await db.insert(notifications).values(notificationsToInsert);
  }
}
