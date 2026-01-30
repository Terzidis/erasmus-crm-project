import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { notifyNewDeal, notifyDealWon, notifyDealLost } from "./emailNotification";
import {
  generateCSV,
  generateExcel,
  contactColumns,
  dealColumns,
  companyColumns,
  activityColumns,
  dashboardReportColumns,
  generateDashboardReportData,
  ExportFormat,
} from "./exportService";

// Admin-only procedure middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Zod schemas for validation
const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  companyId: z.number().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  linkedIn: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["lead", "prospect", "customer", "inactive"]).optional(),
  source: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
});

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  industry: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  employeeCount: z.number().optional().nullable(),
  annualRevenue: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
});

const dealSchema = z.object({
  title: z.string().min(1, "Deal title is required"),
  value: z.string().optional().nullable(),
  currency: z.string().default("EUR"),
  stage: z.enum(["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.date().optional().nullable(),
  contactId: z.number().optional().nullable(),
  companyId: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  lostReason: z.string().optional().nullable(),
});

const activitySchema = z.object({
  type: z.enum(["call", "email", "meeting", "task", "note"]),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  contactId: z.number().optional().nullable(),
  companyId: z.number().optional().nullable(),
  dealId: z.number().optional().nullable(),
});

const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // User management (admin only)
  users: router({
    list: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    
    // Email notification preferences (for current user)
    getEmailPreferences: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserEmailPreferences(ctx.user.id);
    }),
    
    updateEmailPreferences: protectedProcedure
      .input(z.object({
        emailNotifyNewDeal: z.boolean().optional(),
        emailNotifyDealWon: z.boolean().optional(),
        emailNotifyDealLost: z.boolean().optional(),
        emailNotifyOverdue: z.boolean().optional(),
        emailNotifyActivityDue: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUserEmailPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Contact management
  contacts: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        search: z.string().optional(),
        status: z.string().optional(),
        statuses: z.array(z.string()).optional(),
        sources: z.array(z.string()).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAllContacts({
          ...input,
          ownerId: ctx.user.role === "admin" ? undefined : ctx.user.id,
        });
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const contact = await db.getContactById(input.id);
        if (!contact) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
        }
        return contact;
      }),
    
    create: protectedProcedure
      .input(contactSchema)
      .mutation(async ({ input, ctx }) => {
        return db.createContact({ ...input, ownerId: ctx.user.id });
      }),
    
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: contactSchema.partial() }))
      .mutation(async ({ input }) => {
        await db.updateContact(input.id, input.data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContact(input.id);
        return { success: true };
      }),
    
    count: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getContactsCount({
          ...input,
          ownerId: ctx.user.role === "admin" ? undefined : ctx.user.id,
        });
      }),
    
    byStatus: protectedProcedure.query(async () => {
      return db.getContactsByStatus();
    }),
  }),

  // Company management
  companies: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAllCompanies({
          ...input,
          ownerId: ctx.user.role === "admin" ? undefined : ctx.user.id,
        });
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const company = await db.getCompanyById(input.id);
        if (!company) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        return company;
      }),
    
    create: protectedProcedure
      .input(companySchema)
      .mutation(async ({ input, ctx }) => {
        return db.createCompany({ ...input, ownerId: ctx.user.id });
      }),
    
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: companySchema.partial() }))
      .mutation(async ({ input }) => {
        await db.updateCompany(input.id, input.data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCompany(input.id);
        return { success: true };
      }),
    
    count: protectedProcedure.query(async () => {
      return db.getCompaniesCount();
    }),
  }),

  // Deal management
  deals: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        stage: z.string().optional(),
        stages: z.array(z.string()).optional(),
        valueMin: z.number().optional(),
        valueMax: z.number().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAllDeals({
          ...input,
          ownerId: ctx.user.role === "admin" ? undefined : ctx.user.id,
        });
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const deal = await db.getDealById(input.id);
        if (!deal) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
        }
        return deal;
      }),
    
    create: protectedProcedure
      .input(dealSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await db.createDeal({ ...input, ownerId: ctx.user.id });
        
        // Create in-app notification for new deal
        await db.createNotificationsForAllUsers(
          {
            type: "new_deal",
            title: "New Deal Created",
            message: `${ctx.user.name || 'A user'} created a new deal: ${input.title}`,
            link: `/deals`,
            relatedDealId: result.id,
          },
          ctx.user.id // Exclude the creator from notification
        );
        
        // Send email notification (async, don't wait)
        notifyNewDeal(
          input.title,
          input.value ?? null,
          ctx.user.name || 'A user',
          ctx.user.id
        ).catch(err => console.error('[Email] Failed to send new deal notification:', err));
        
        return result;
      }),
    
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: dealSchema.partial() }))
      .mutation(async ({ input, ctx }) => {
        const existingDeal = await db.getDealById(input.id);
        await db.updateDeal(input.id, input.data);
        
        // Notify on deal stage change to won or lost
        if (input.data.stage && existingDeal && existingDeal.stage !== input.data.stage) {
          if (input.data.stage === "closed_won") {
            // In-app notification
            await db.createNotificationsForAllUsers(
              {
                type: "deal_won",
                title: "Deal Won! 🎉",
                message: `${existingDeal.title} has been marked as won`,
                link: `/deals`,
                relatedDealId: input.id,
              },
              ctx.user.id
            );
            // Email notification (async)
            notifyDealWon(
              existingDeal.title,
              existingDeal.value?.toString() ?? null,
              ctx.user.name || 'A user',
              ctx.user.id
            ).catch(err => console.error('[Email] Failed to send deal won notification:', err));
          } else if (input.data.stage === "closed_lost") {
            // In-app notification
            await db.createNotificationsForAllUsers(
              {
                type: "deal_lost",
                title: "Deal Lost",
                message: `${existingDeal.title} has been marked as lost`,
                link: `/deals`,
                relatedDealId: input.id,
              },
              ctx.user.id
            );
            // Email notification (async)
            notifyDealLost(
              existingDeal.title,
              existingDeal.value?.toString() ?? null,
              input.data.lostReason ?? existingDeal.lostReason ?? null,
              ctx.user.name || 'A user',
              ctx.user.id
            ).catch(err => console.error('[Email] Failed to send deal lost notification:', err));
          }
        }
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDeal(input.id);
        return { success: true };
      }),
    
    count: protectedProcedure
      .input(z.object({ stage: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getDealsCount(input);
      }),
    
    pipelineStats: protectedProcedure.query(async () => {
      return db.getDealsPipelineStats();
    }),
  }),

  // Activity management
  activities: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        type: z.string().optional(),
        types: z.array(z.string()).optional(),
        contactId: z.number().optional(),
        companyId: z.number().optional(),
        dealId: z.number().optional(),
        isCompleted: z.boolean().optional(),
        status: z.enum(["pending", "completed", "overdue"]).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAllActivities({
          ...input,
          ownerId: ctx.user.role === "admin" ? undefined : ctx.user.id,
        });
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const activity = await db.getActivityById(input.id);
        if (!activity) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Activity not found" });
        }
        return activity;
      }),
    
    create: protectedProcedure
      .input(activitySchema)
      .mutation(async ({ input, ctx }) => {
        return db.createActivity({ ...input, ownerId: ctx.user.id });
      }),
    
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: activitySchema.partial() }))
      .mutation(async ({ input }) => {
        await db.updateActivity(input.id, input.data);
        return { success: true };
      }),
    
    complete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateActivity(input.id, { isCompleted: true, completedAt: new Date() });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteActivity(input.id);
        return { success: true };
      }),
    
    recent: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getRecentActivities(input?.limit ?? 10);
      }),
    
    byType: protectedProcedure.query(async () => {
      return db.getActivitiesByType();
    }),
  }),

  // Tag management
  tags: router({
    list: protectedProcedure.query(async () => {
      return db.getAllTags();
    }),
    
    create: protectedProcedure
      .input(tagSchema)
      .mutation(async ({ input }) => {
        return db.createTag(input);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTag(input.id);
        return { success: true };
      }),
  }),

  // Dashboard
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return db.getDashboardStats();
    }),
  }),

  // Export functionality
  export: router({
    contacts: protectedProcedure
      .input(z.object({ format: z.enum(["csv", "xlsx"]) }))
      .mutation(async ({ input, ctx }) => {
        const contacts = await db.getAllContacts({
          ownerId: ctx.user.role === "admin" ? undefined : ctx.user.id,
        });
        
        if (input.format === "csv") {
          const csv = generateCSV(contacts, contactColumns);
          return {
            data: csv,
            filename: `contacts_export_${new Date().toISOString().split("T")[0]}.csv`,
            mimeType: "text/csv",
          };
        } else {
          const buffer = generateExcel(contacts, contactColumns, "Contacts");
          return {
            data: buffer.toString("base64"),
            filename: `contacts_export_${new Date().toISOString().split("T")[0]}.xlsx`,
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            isBase64: true,
          };
        }
      }),
    
    deals: protectedProcedure
      .input(z.object({ format: z.enum(["csv", "xlsx"]) }))
      .mutation(async ({ input, ctx }) => {
        const deals = await db.getAllDeals({
          ownerId: ctx.user.role === "admin" ? undefined : ctx.user.id,
        });
        
        if (input.format === "csv") {
          const csv = generateCSV(deals, dealColumns);
          return {
            data: csv,
            filename: `deals_export_${new Date().toISOString().split("T")[0]}.csv`,
            mimeType: "text/csv",
          };
        } else {
          const buffer = generateExcel(deals, dealColumns, "Deals");
          return {
            data: buffer.toString("base64"),
            filename: `deals_export_${new Date().toISOString().split("T")[0]}.xlsx`,
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            isBase64: true,
          };
        }
      }),
    
    companies: protectedProcedure
      .input(z.object({ format: z.enum(["csv", "xlsx"]) }))
      .mutation(async ({ input }) => {
        const companies = await db.getAllCompanies({});
        
        if (input.format === "csv") {
          const csv = generateCSV(companies, companyColumns);
          return {
            data: csv,
            filename: `companies_export_${new Date().toISOString().split("T")[0]}.csv`,
            mimeType: "text/csv",
          };
        } else {
          const buffer = generateExcel(companies, companyColumns, "Companies");
          return {
            data: buffer.toString("base64"),
            filename: `companies_export_${new Date().toISOString().split("T")[0]}.xlsx`,
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            isBase64: true,
          };
        }
      }),
    
    activities: protectedProcedure
      .input(z.object({ format: z.enum(["csv", "xlsx"]) }))
      .mutation(async ({ input, ctx }) => {
        const activities = await db.getAllActivities({
          ownerId: ctx.user.role === "admin" ? undefined : ctx.user.id,
        });
        
        if (input.format === "csv") {
          const csv = generateCSV(activities, activityColumns);
          return {
            data: csv,
            filename: `activities_export_${new Date().toISOString().split("T")[0]}.csv`,
            mimeType: "text/csv",
          };
        } else {
          const buffer = generateExcel(activities, activityColumns, "Activities");
          return {
            data: buffer.toString("base64"),
            filename: `activities_export_${new Date().toISOString().split("T")[0]}.xlsx`,
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            isBase64: true,
          };
        }
      }),
    
    dashboardReport: protectedProcedure
      .input(z.object({ format: z.enum(["csv", "xlsx"]) }))
      .mutation(async ({ input }) => {
        const stats = await db.getDashboardStats();
        const reportData = generateDashboardReportData(stats);
        
        if (input.format === "csv") {
          const csv = generateCSV(reportData, dashboardReportColumns);
          return {
            data: csv,
            filename: `crm_report_${new Date().toISOString().split("T")[0]}.csv`,
            mimeType: "text/csv",
          };
        } else {
          const buffer = generateExcel(reportData, dashboardReportColumns, "CRM Report");
          return {
            data: buffer.toString("base64"),
            filename: `crm_report_${new Date().toISOString().split("T")[0]}.xlsx`,
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            isBase64: true,
          };
        }
      }),
  }),

  // Notifications
  notifications: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        unreadOnly: z.boolean().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getUserNotifications(ctx.user.id, input);
      }),
    
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.markNotificationAsRead(input.id, ctx.user.id);
        return { success: true };
      }),
    
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteNotification(input.id, ctx.user.id);
        return { success: true };
      }),
    
    upcomingActivities: protectedProcedure.query(async ({ ctx }) => {
      return db.getUpcomingActivities(ctx.user.id);
    }),
    
    overdueActivities: protectedProcedure.query(async ({ ctx }) => {
      return db.getOverdueActivities(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
