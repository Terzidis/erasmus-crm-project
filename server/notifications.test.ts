import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getUserNotifications: vi.fn().mockResolvedValue([
      {
        id: 1,
        userId: 1,
        type: "new_deal",
        title: "New Deal Created",
        message: "Test user created a new deal: Enterprise License",
        link: "/deals",
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: 2,
        userId: 1,
        type: "deal_won",
        title: "Deal Won! 🎉",
        message: "Enterprise License has been marked as won",
        link: "/deals",
        isRead: true,
        createdAt: new Date(Date.now() - 86400000),
      },
    ]),
    getUnreadNotificationCount: vi.fn().mockResolvedValue(3),
    markNotificationAsRead: vi.fn().mockResolvedValue(undefined),
    markAllNotificationsAsRead: vi.fn().mockResolvedValue(undefined),
    deleteNotification: vi.fn().mockResolvedValue(undefined),
    createNotification: vi.fn().mockResolvedValue({ id: 1 }),
    getUpcomingActivities: vi.fn().mockResolvedValue([
      {
        id: 1,
        type: "task",
        subject: "Follow up call",
        dueDate: new Date(),
        isCompleted: false,
      },
    ]),
    getOverdueActivities: vi.fn().mockResolvedValue([
      {
        id: 2,
        type: "meeting",
        subject: "Client meeting",
        dueDate: new Date(Date.now() - 86400000),
        isCompleted: false,
      },
    ]),
    createNotificationsForAllUsers: vi.fn().mockResolvedValue(undefined),
    createDeal: vi.fn().mockResolvedValue({ id: 1 }),
    getDealById: vi.fn().mockResolvedValue({
      id: 1,
      title: "Test Deal",
      stage: "lead",
    }),
    updateDeal: vi.fn().mockResolvedValue(undefined),
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
    getAllActivities: vi.fn().mockResolvedValue([]),
    getActivityById: vi.fn().mockResolvedValue(null),
    createActivity: vi.fn().mockResolvedValue({ id: 1 }),
    updateActivity: vi.fn().mockResolvedValue(undefined),
    getRecentActivities: vi.fn().mockResolvedValue([]),
    getActivitiesByType: vi.fn().mockResolvedValue([]),
    getAllTags: vi.fn().mockResolvedValue([]),
    createTag: vi.fn().mockResolvedValue({ id: 1 }),
    getDashboardStats: vi.fn().mockResolvedValue({
      totalContacts: 10,
      totalCompanies: 5,
      totalDeals: 3,
      openActivities: 7,
      pipelineValue: "50000",
      wonDealsValue: "25000",
    }),
    getAllUsers: vi.fn().mockResolvedValue([]),
    updateUserRole: vi.fn().mockResolvedValue(undefined),
  };
});

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

describe("Notification Routers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("notifications.list", () => {
    it("returns user notifications", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].type).toBe("new_deal");
    });

    it("supports limit and unreadOnly options", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.list({ limit: 10, unreadOnly: true });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("notifications.unreadCount", () => {
    it("returns unread notification count", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.unreadCount();

      expect(result).toBe(3);
    });
  });

  describe("notifications.markAsRead", () => {
    it("marks a notification as read", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.markAsRead({ id: 1 });

      expect(result).toEqual({ success: true });
    });
  });

  describe("notifications.markAllAsRead", () => {
    it("marks all notifications as read", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.markAllAsRead();

      expect(result).toEqual({ success: true });
    });
  });

  describe("notifications.delete", () => {
    it("deletes a notification", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.delete({ id: 1 });

      expect(result).toEqual({ success: true });
    });
  });

  describe("notifications.upcomingActivities", () => {
    it("returns upcoming activities", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.upcomingActivities();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].subject).toBe("Follow up call");
    });
  });

  describe("notifications.overdueActivities", () => {
    it("returns overdue activities", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.overdueActivities();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].subject).toBe("Client meeting");
    });
  });

  describe("deal notifications", () => {
    it("creates notification when deal is created", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const db = await import("./db");

      await caller.deals.create({
        title: "New Enterprise Deal",
        value: "50000",
        stage: "lead",
      });

      expect(db.createNotificationsForAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "new_deal",
          title: "New Deal Created",
        }),
        1 // Exclude creator
      );
    });

    it("creates notification when deal is won", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const db = await import("./db");

      await caller.deals.update({
        id: 1,
        data: { stage: "closed_won" },
      });

      expect(db.createNotificationsForAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "deal_won",
          title: "Deal Won! 🎉",
        }),
        1
      );
    });

    it("creates notification when deal is lost", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const db = await import("./db");

      // Reset mock to change deal stage
      (db.getDealById as any).mockResolvedValueOnce({
        id: 1,
        title: "Test Deal",
        stage: "negotiation",
      });

      await caller.deals.update({
        id: 1,
        data: { stage: "closed_lost" },
      });

      expect(db.createNotificationsForAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "deal_lost",
          title: "Deal Lost",
        }),
        1
      );
    });
  });
});
