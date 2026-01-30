import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getUserEmailPreferences: vi.fn().mockResolvedValue({
      emailNotifyNewDeal: true,
      emailNotifyDealWon: true,
      emailNotifyDealLost: false,
      emailNotifyOverdue: true,
      emailNotifyActivityDue: true,
    }),
    updateUserEmailPreferences: vi.fn().mockResolvedValue(undefined),
    getAllUsers: vi.fn().mockResolvedValue([
      { id: 1, email: "user1@example.com", name: "User 1" },
      { id: 2, email: "user2@example.com", name: "User 2" },
    ]),
    createDeal: vi.fn().mockResolvedValue({ id: 1 }),
    getDealById: vi.fn().mockResolvedValue({ id: 1, title: "Test Deal", stage: "lead", value: "10000" }),
    updateDeal: vi.fn().mockResolvedValue(undefined),
    createNotificationsForAllUsers: vi.fn().mockResolvedValue(undefined),
    getAllContacts: vi.fn().mockResolvedValue([]),
    getContactById: vi.fn().mockResolvedValue(null),
    createContact: vi.fn().mockResolvedValue({ id: 1 }),
    updateContact: vi.fn().mockResolvedValue(undefined),
    deleteContact: vi.fn().mockResolvedValue(undefined),
    getContactsCount: vi.fn().mockResolvedValue(10),
    getContactsByStatus: vi.fn().mockResolvedValue([]),
    getAllCompanies: vi.fn().mockResolvedValue([]),
    getCompanyById: vi.fn().mockResolvedValue(null),
    createCompany: vi.fn().mockResolvedValue({ id: 1 }),
    getCompaniesCount: vi.fn().mockResolvedValue(5),
    getAllDeals: vi.fn().mockResolvedValue([]),
    getDealsCount: vi.fn().mockResolvedValue(3),
    getDealsPipelineStats: vi.fn().mockResolvedValue([]),
    deleteDeal: vi.fn().mockResolvedValue(undefined),
    getAllActivities: vi.fn().mockResolvedValue([]),
    getActivityById: vi.fn().mockResolvedValue(null),
    createActivity: vi.fn().mockResolvedValue({ id: 1 }),
    updateActivity: vi.fn().mockResolvedValue(undefined),
    deleteActivity: vi.fn().mockResolvedValue(undefined),
    getRecentActivities: vi.fn().mockResolvedValue([]),
    getActivitiesByType: vi.fn().mockResolvedValue([]),
    getAllTags: vi.fn().mockResolvedValue([]),
    createTag: vi.fn().mockResolvedValue({ id: 1 }),
    deleteTag: vi.fn().mockResolvedValue(undefined),
    getDashboardStats: vi.fn().mockResolvedValue({
      totalContacts: 10,
      totalCompanies: 5,
      totalDeals: 3,
      openActivities: 7,
      pipelineValue: "50000",
      wonDealsValue: "25000",
    }),
    updateUserRole: vi.fn().mockResolvedValue(undefined),
    getUserNotifications: vi.fn().mockResolvedValue([]),
    getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
    markNotificationAsRead: vi.fn().mockResolvedValue(undefined),
    markAllNotificationsAsRead: vi.fn().mockResolvedValue(undefined),
    deleteNotification: vi.fn().mockResolvedValue(undefined),
    getUpcomingActivities: vi.fn().mockResolvedValue([]),
    getOverdueActivities: vi.fn().mockResolvedValue([]),
  };
});

// Mock the email notification module
vi.mock("./emailNotification", () => ({
  notifyNewDeal: vi.fn().mockResolvedValue(true),
  notifyDealWon: vi.fn().mockResolvedValue(true),
  notifyDealLost: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Email Notification Preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("users.getEmailPreferences", () => {
    it("returns user email preferences", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.getEmailPreferences();

      expect(result).toBeDefined();
      expect(result?.emailNotifyNewDeal).toBe(true);
      expect(result?.emailNotifyDealWon).toBe(true);
      expect(result?.emailNotifyDealLost).toBe(false);
      expect(result?.emailNotifyOverdue).toBe(true);
      expect(result?.emailNotifyActivityDue).toBe(true);
    });
  });

  describe("users.updateEmailPreferences", () => {
    it("updates email preferences", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const db = await import("./db");

      const result = await caller.users.updateEmailPreferences({
        emailNotifyNewDeal: false,
        emailNotifyDealWon: true,
      });

      expect(result).toEqual({ success: true });
      expect(db.updateUserEmailPreferences).toHaveBeenCalledWith(1, {
        emailNotifyNewDeal: false,
        emailNotifyDealWon: true,
      });
    });

    it("updates single preference", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const db = await import("./db");

      const result = await caller.users.updateEmailPreferences({
        emailNotifyOverdue: false,
      });

      expect(result).toEqual({ success: true });
      expect(db.updateUserEmailPreferences).toHaveBeenCalledWith(1, {
        emailNotifyOverdue: false,
      });
    });
  });

  describe("deal email notifications", () => {
    it("triggers email notification on deal creation", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const emailNotification = await import("./emailNotification");

      await caller.deals.create({
        title: "New Test Deal",
        value: "25000",
        stage: "lead",
      });

      // Email notification should be called (async)
      expect(emailNotification.notifyNewDeal).toHaveBeenCalled();
    });

    it("triggers email notification on deal won", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const emailNotification = await import("./emailNotification");

      await caller.deals.update({
        id: 1,
        data: { stage: "closed_won" },
      });

      expect(emailNotification.notifyDealWon).toHaveBeenCalled();
    });

    it("triggers email notification on deal lost", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const emailNotification = await import("./emailNotification");
      const db = await import("./db");

      // Set up deal to be in negotiation stage
      (db.getDealById as any).mockResolvedValueOnce({
        id: 1,
        title: "Test Deal",
        stage: "negotiation",
        value: "10000",
      });

      await caller.deals.update({
        id: 1,
        data: { stage: "closed_lost", lostReason: "Budget constraints" },
      });

      expect(emailNotification.notifyDealLost).toHaveBeenCalled();
    });
  });
});
