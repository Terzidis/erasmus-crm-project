import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  getAllContacts: vi.fn().mockResolvedValue([
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1234567890",
      status: "lead",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getContactById: vi.fn().mockResolvedValue({
    id: 1,
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    status: "lead",
  }),
  createContact: vi.fn().mockResolvedValue({ id: 1 }),
  updateContact: vi.fn().mockResolvedValue(undefined),
  deleteContact: vi.fn().mockResolvedValue(undefined),
  getContactsCount: vi.fn().mockResolvedValue(10),
  getContactsByStatus: vi.fn().mockResolvedValue([
    { status: "lead", count: 5 },
    { status: "customer", count: 3 },
  ]),
  getAllCompanies: vi.fn().mockResolvedValue([]),
  getCompanyById: vi.fn().mockResolvedValue(null),
  createCompany: vi.fn().mockResolvedValue({ id: 1 }),
  getCompaniesCount: vi.fn().mockResolvedValue(5),
  getAllDeals: vi.fn().mockResolvedValue([]),
  getDealById: vi.fn().mockResolvedValue({ id: 1, title: "Test Deal", stage: "lead" }),
  createDeal: vi.fn().mockResolvedValue({ id: 1 }),
  updateDeal: vi.fn().mockResolvedValue(undefined),
  createNotificationsForAllUsers: vi.fn().mockResolvedValue(undefined),
  getDealsCount: vi.fn().mockResolvedValue(3),
  getDealsPipelineStats: vi.fn().mockResolvedValue([
    { stage: "lead", count: 2, totalValue: "10000" },
  ]),
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

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("CRM Routers", () => {
  describe("auth.me", () => {
    it("returns user when authenticated", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeDefined();
      expect(result?.email).toBe("test@example.com");
      expect(result?.name).toBe("Test User");
    });

    it("returns null when not authenticated", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeNull();
    });
  });

  describe("contacts", () => {
    it("lists contacts for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.contacts.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("creates a contact", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.contacts.create({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        status: "prospect",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it("gets contacts by status", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.contacts.byStatus();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("deals", () => {
    it("creates a deal", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.deals.create({
        title: "Enterprise License",
        value: "50000",
        stage: "qualified",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it("gets pipeline stats", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.deals.pipelineStats();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("activities", () => {
    it("creates an activity", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activities.create({
        type: "call",
        subject: "Follow up call",
        description: "Discuss pricing options",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it("gets recent activities", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activities.recent({ limit: 5 });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("dashboard", () => {
    it("returns dashboard stats", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.dashboard.stats();

      expect(result).toBeDefined();
      expect(result.totalContacts).toBe(10);
      expect(result.totalCompanies).toBe(5);
      expect(result.totalDeals).toBe(3);
      expect(result.openActivities).toBe(7);
      expect(result.pipelineValue).toBe("50000");
      expect(result.wonDealsValue).toBe("25000");
    });
  });

  describe("admin procedures", () => {
    it("allows admin to list users", async () => {
      const ctx = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("denies non-admin from listing users", async () => {
      const ctx = createAuthContext("user");
      const caller = appRouter.createCaller(ctx);

      await expect(caller.users.list()).rejects.toThrow("Admin access required");
    });
  });
});
