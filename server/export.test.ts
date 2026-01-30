import { describe, expect, it, vi } from "vitest";
import { generateCSV, generateExcel, contactColumns, dealColumns, dashboardReportColumns, generateDashboardReportData } from "./exportService";

describe("Export Service", () => {
  describe("generateCSV", () => {
    it("generates CSV with headers for empty data", () => {
      const result = generateCSV([], contactColumns);
      expect(result).toContain("ID");
      expect(result).toContain("First Name");
      expect(result).toContain("Last Name");
      expect(result).toContain("Email");
    });

    it("generates CSV with data rows", () => {
      const data = [
        {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "123456789",
          status: "customer",
        },
        {
          id: 2,
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          phone: "987654321",
          status: "lead",
        },
      ];

      const result = generateCSV(data, contactColumns);
      
      expect(result).toContain('"John"');
      expect(result).toContain('"Doe"');
      expect(result).toContain('"john@example.com"');
      expect(result).toContain('"Jane"');
      expect(result).toContain('"Smith"');
    });

    it("handles null values correctly", () => {
      const data = [
        {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: null,
          phone: null,
        },
      ];

      const result = generateCSV(data, contactColumns);
      expect(result).toContain('""'); // Empty quotes for null values
    });

    it("escapes quotes in values", () => {
      const data = [
        {
          id: 1,
          firstName: 'John "Johnny"',
          lastName: "Doe",
        },
      ];

      const result = generateCSV(data, contactColumns);
      expect(result).toContain('"John ""Johnny"""');
    });
  });

  describe("generateExcel", () => {
    it("generates Excel buffer", () => {
      const data = [
        {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      ];

      const result = generateExcel(data, contactColumns, "Contacts");
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it("generates Excel for empty data", () => {
      const result = generateExcel([], contactColumns, "Contacts");
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("dealColumns", () => {
    it("formats deal data correctly", () => {
      const data = [
        {
          id: 1,
          title: "Big Deal",
          value: "50000",
          currency: "EUR",
          stage: "proposal",
          probability: 75,
          createdAt: new Date("2024-01-15"),
        },
      ];

      const result = generateCSV(data, dealColumns);
      
      expect(result).toContain('"Big Deal"');
      expect(result).toContain('"50000"');
      expect(result).toContain('"proposal"');
      expect(result).toContain('"75"');
      expect(result).toContain('"2024-01-15"');
    });
  });

  describe("generateDashboardReportData", () => {
    it("generates dashboard report data", () => {
      const stats = {
        totalContacts: 100,
        totalCompanies: 25,
        totalDeals: 50,
        openActivities: 30,
        pipelineValue: "500000",
        wonDealsValue: "250000",
      };

      const result = generateDashboardReportData(stats);

      expect(result).toHaveLength(6);
      expect(result[0]).toEqual({
        metric: "Total Contacts",
        value: 100,
        description: "Active contacts in CRM",
      });
      expect(result[4]).toEqual({
        metric: "Pipeline Value",
        value: "€500,000",
        description: "Total value of active opportunities",
      });
    });

    it("handles zero values", () => {
      const stats = {
        totalContacts: 0,
        totalCompanies: 0,
        totalDeals: 0,
        openActivities: 0,
        pipelineValue: "0",
        wonDealsValue: "0",
      };

      const result = generateDashboardReportData(stats);

      expect(result[0].value).toBe(0);
      expect(result[4].value).toBe("€0");
    });
  });

  describe("CSV with dashboard report", () => {
    it("generates CSV for dashboard report", () => {
      const stats = {
        totalContacts: 100,
        totalCompanies: 25,
        totalDeals: 50,
        openActivities: 30,
        pipelineValue: "500000",
        wonDealsValue: "250000",
      };

      const reportData = generateDashboardReportData(stats);
      const result = generateCSV(reportData, dashboardReportColumns);

      expect(result).toContain('"Metric"');
      expect(result).toContain('"Value"');
      expect(result).toContain('"Description"');
      expect(result).toContain('"Total Contacts"');
      expect(result).toContain('"100"');
    });
  });
});
