import { Prisma } from "@prisma/client";

export const reportStatuses = [
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "RETURNED",
] as const;

export type ReportStatus = (typeof reportStatuses)[number];

export interface ReportRequest {
  status: ReportStatus;
  amount: Prisma.Decimal | number | string;
}

export interface ReportMetrics {
  totalCount: number;
  statusCounts: Record<ReportStatus, number>;
  statusAmounts: Record<ReportStatus, string>;
  totalAmount: string;
}

export function aggregateReportMetrics(requests: readonly ReportRequest[]): ReportMetrics {
  const statusCounts: Record<ReportStatus, number> = {
    DRAFT: 0,
    PENDING_REVIEW: 0,
    APPROVED: 0,
    REJECTED: 0,
    RETURNED: 0,
  };
  const statusAmounts: Record<ReportStatus, Prisma.Decimal> = {
    DRAFT: new Prisma.Decimal(0),
    PENDING_REVIEW: new Prisma.Decimal(0),
    APPROVED: new Prisma.Decimal(0),
    REJECTED: new Prisma.Decimal(0),
    RETURNED: new Prisma.Decimal(0),
  };
  let totalAmount = new Prisma.Decimal(0);

  for (const request of requests) {
    statusCounts[request.status] += 1;
    totalAmount = totalAmount.plus(request.amount);
    statusAmounts[request.status] = statusAmounts[request.status].plus(request.amount);
  }

  return {
    totalCount: requests.length,
    statusCounts,
    statusAmounts: {
      DRAFT: statusAmounts.DRAFT.toFixed(2),
      PENDING_REVIEW: statusAmounts.PENDING_REVIEW.toFixed(2),
      APPROVED: statusAmounts.APPROVED.toFixed(2),
      REJECTED: statusAmounts.REJECTED.toFixed(2),
      RETURNED: statusAmounts.RETURNED.toFixed(2),
    },
    totalAmount: totalAmount.toFixed(2),
  };
}
