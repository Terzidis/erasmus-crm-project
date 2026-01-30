import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getAllContacts: vi.fn().mockResolvedValue([
    { id: 1, firstName: "John", lastName: "Doe", status: "lead", source: "website", createdAt: new Date() },
    { id: 2, firstName: "Jane", lastName: "Smith", status: "customer", source: "referral", createdAt: new Date() },
  ]),
  getAllDeals: vi.fn().mockResolvedValue([
    { id: 1, title: "Deal 1", stage: "lead", value: "10000", createdAt: new Date() },
    { id: 2, title: "Deal 2", stage: "closed_won", value: "50000", createdAt: new Date() },
  ]),
  getAllActivities: vi.fn().mockResolvedValue([
    { id: 1, type: "call", subject: "Follow up", isCompleted: false, dueDate: new Date() },
    { id: 2, type: "meeting", subject: "Demo", isCompleted: true, dueDate: new Date() },
  ]),
  getDb: vi.fn().mockResolvedValue({}),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
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

describe("Advanced Filtering", () => {
  let ctx: TrpcContext;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
    vi.clearAllMocks();
  });

  describe("contacts.list with filters", () => {
    it("accepts multi-select status filter", async () => {
      const result = await caller.contacts.list({
        statuses: ["lead", "customer"],
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts multi-select source filter", async () => {
      const result = await caller.contacts.list({
        sources: ["website", "referral"],
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts date range filter", async () => {
      const result = await caller.contacts.list({
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts combined filters", async () => {
      const result = await caller.contacts.list({
        statuses: ["lead"],
        sources: ["website"],
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
        search: "John",
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("deals.list with filters", () => {
    it("accepts multi-select stage filter", async () => {
      const result = await caller.deals.list({
        stages: ["lead", "qualified", "closed_won"],
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts value range filter", async () => {
      const result = await caller.deals.list({
        valueMin: 1000,
        valueMax: 100000,
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts date range filter", async () => {
      const result = await caller.deals.list({
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts combined filters", async () => {
      const result = await caller.deals.list({
        stages: ["proposal", "negotiation"],
        valueMin: 5000,
        valueMax: 50000,
        dateFrom: new Date("2024-06-01"),
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("activities.list with filters", () => {
    it("accepts multi-select type filter", async () => {
      const result = await caller.activities.list({
        types: ["call", "email", "meeting"],
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts status filter (pending/completed/overdue)", async () => {
      const result = await caller.activities.list({
        status: "pending",
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts date range filter", async () => {
      const result = await caller.activities.list({
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts combined filters", async () => {
      const result = await caller.activities.list({
        types: ["task", "meeting"],
        status: "overdue",
        dateFrom: new Date("2024-01-01"),
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
