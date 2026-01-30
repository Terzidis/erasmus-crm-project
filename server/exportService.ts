import * as XLSX from "xlsx";

export type ExportFormat = "csv" | "xlsx";

interface ExportColumn {
  key: string;
  header: string;
  formatter?: (value: any) => string;
}

/**
 * Generate CSV content from data array
 */
export function generateCSV(data: Record<string, any>[], columns: ExportColumn[]): string {
  if (data.length === 0) {
    return columns.map(c => c.header).join(",") + "\n";
  }

  const headers = columns.map(c => `"${c.header}"`).join(",");
  
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key];
      if (col.formatter) {
        value = col.formatter(value);
      }
      if (value === null || value === undefined) {
        return '""';
      }
      // Escape quotes and wrap in quotes
      const strValue = String(value).replace(/"/g, '""');
      return `"${strValue}"`;
    }).join(",");
  });

  return [headers, ...rows].join("\n");
}

/**
 * Generate Excel workbook buffer from data array
 */
export function generateExcel(data: Record<string, any>[], columns: ExportColumn[], sheetName: string = "Data"): Buffer {
  // Transform data to use headers
  const transformedData = data.map(row => {
    const newRow: Record<string, any> = {};
    columns.forEach(col => {
      let value = row[col.key];
      if (col.formatter) {
        value = col.formatter(value);
      }
      newRow[col.header] = value ?? "";
    });
    return newRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(transformedData, {
    header: columns.map(c => c.header),
  });

  // Set column widths
  const colWidths = columns.map(col => ({
    wch: Math.max(col.header.length, 15),
  }));
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

// Contact export columns
export const contactColumns: ExportColumn[] = [
  { key: "id", header: "ID" },
  { key: "firstName", header: "First Name" },
  { key: "lastName", header: "Last Name" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "mobile", header: "Mobile" },
  { key: "jobTitle", header: "Job Title" },
  { key: "department", header: "Department" },
  { key: "address", header: "Address" },
  { key: "city", header: "City" },
  { key: "country", header: "Country" },
  { key: "status", header: "Status" },
  { key: "source", header: "Source" },
  { key: "linkedIn", header: "LinkedIn" },
  { key: "twitter", header: "Twitter" },
  { key: "notes", header: "Notes" },
  { 
    key: "createdAt", 
    header: "Created At",
    formatter: (v) => v ? new Date(v).toISOString().split("T")[0] : "",
  },
];

// Deal export columns
export const dealColumns: ExportColumn[] = [
  { key: "id", header: "ID" },
  { key: "title", header: "Title" },
  { key: "value", header: "Value" },
  { key: "currency", header: "Currency" },
  { key: "stage", header: "Stage" },
  { key: "probability", header: "Probability (%)" },
  { 
    key: "expectedCloseDate", 
    header: "Expected Close Date",
    formatter: (v) => v ? new Date(v).toISOString().split("T")[0] : "",
  },
  { key: "description", header: "Description" },
  { key: "lostReason", header: "Lost Reason" },
  { 
    key: "createdAt", 
    header: "Created At",
    formatter: (v) => v ? new Date(v).toISOString().split("T")[0] : "",
  },
];

// Company export columns
export const companyColumns: ExportColumn[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Company Name" },
  { key: "industry", header: "Industry" },
  { key: "website", header: "Website" },
  { key: "phone", header: "Phone" },
  { key: "email", header: "Email" },
  { key: "address", header: "Address" },
  { key: "city", header: "City" },
  { key: "country", header: "Country" },
  { key: "employeeCount", header: "Employee Count" },
  { key: "annualRevenue", header: "Annual Revenue" },
  { key: "description", header: "Description" },
  { 
    key: "createdAt", 
    header: "Created At",
    formatter: (v) => v ? new Date(v).toISOString().split("T")[0] : "",
  },
];

// Activity export columns
export const activityColumns: ExportColumn[] = [
  { key: "id", header: "ID" },
  { key: "type", header: "Type" },
  { key: "subject", header: "Subject" },
  { key: "description", header: "Description" },
  { key: "status", header: "Status" },
  { 
    key: "dueDate", 
    header: "Due Date",
    formatter: (v) => v ? new Date(v).toISOString().split("T")[0] : "",
  },
  { 
    key: "completedAt", 
    header: "Completed At",
    formatter: (v) => v ? new Date(v).toISOString().split("T")[0] : "",
  },
  { 
    key: "createdAt", 
    header: "Created At",
    formatter: (v) => v ? new Date(v).toISOString().split("T")[0] : "",
  },
];

// Dashboard report columns
export const dashboardReportColumns: ExportColumn[] = [
  { key: "metric", header: "Metric" },
  { key: "value", header: "Value" },
  { key: "description", header: "Description" },
];

/**
 * Generate dashboard report data
 */
export function generateDashboardReportData(stats: {
  totalContacts: number;
  totalCompanies: number;
  totalDeals: number;
  openActivities: number;
  pipelineValue: string;
  wonDealsValue: string;
}): Record<string, any>[] {
  return [
    { metric: "Total Contacts", value: stats.totalContacts, description: "Active contacts in CRM" },
    { metric: "Total Companies", value: stats.totalCompanies, description: "Organizations tracked" },
    { metric: "Total Deals", value: stats.totalDeals, description: "Opportunities in pipeline" },
    { metric: "Open Activities", value: stats.openActivities, description: "Tasks pending completion" },
    { metric: "Pipeline Value", value: `€${parseFloat(stats.pipelineValue || "0").toLocaleString()}`, description: "Total value of active opportunities" },
    { metric: "Won Deals Value", value: `€${parseFloat(stats.wonDealsValue || "0").toLocaleString()}`, description: "Total revenue from closed deals" },
  ];
}
