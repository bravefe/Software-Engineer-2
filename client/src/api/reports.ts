import type { PurchaseRequest, RequestFilters } from "./requests";

export const REPORT_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "RETURNED", label: "Returned" },
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number]["value"];

export interface ReportSummary {
  totalCount: number;
  statusCounts: Record<ReportStatus, number>;
  statusAmounts: Record<ReportStatus, string>;
  totalAmount: string;
}

function emptyStatusRecord<T>(value: T): Record<ReportStatus, T> {
  const record = {} as Record<ReportStatus, T>;
  for (const { value: status } of REPORT_STATUSES) {
    record[status] = value;
  }
  return record;
}

export function createEmptyReportSummary(): ReportSummary {
  return {
    totalCount: 0,
    statusCounts: emptyStatusRecord(0),
    statusAmounts: emptyStatusRecord("0.00"),
    totalAmount: "0.00",
  };
}

function buildQuery(filters?: RequestFilters): string {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function fetchReport<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: "include" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch report data");
  }
  return data as T;
}

export function fetchReportSummary(filters?: RequestFilters): Promise<ReportSummary> {
  return fetchReport<ReportSummary>(`/api/reports/summary${buildQuery(filters)}`);
}

export async function fetchReportRequests(filters?: RequestFilters): Promise<PurchaseRequest[]> {
  const data = await fetchReport<{ requests: PurchaseRequest[] }>(
    `/api/reports/requests${buildQuery(filters)}`,
  );
  return data.requests;
}
