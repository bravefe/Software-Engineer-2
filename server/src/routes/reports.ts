import { PurchaseRequestStatus, Prisma } from "@prisma/client";
import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { prisma } from "../prisma";
import { aggregateReportMetrics, reportStatuses } from "../utils/reports";

const router = Router();

router.use(requireAuth, requireRole(["REVIEWER"]));

function parseDate(value: unknown, endOfDay = false): Date | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  if (endOfDay) date.setUTCHours(23, 59, 59, 999);
  return date;
}

function buildReportWhere(
  filters: { status?: unknown; startDate?: unknown; endDate?: unknown },
  reviewerId: number,
): { where: Prisma.PurchaseRequestWhereInput } | { error: string } {
  let status: PurchaseRequestStatus | undefined;
  if (filters.status !== undefined) {
    if (
      typeof filters.status !== "string" ||
      !reportStatuses.includes(filters.status as (typeof reportStatuses)[number])
    ) {
      return { error: `Invalid status filter. Valid values: ${reportStatuses.join(", ")}` };
    }
    status = filters.status as PurchaseRequestStatus;
  }

  const startDate = parseDate(filters.startDate);
  if (startDate === null) {
    return { error: "Invalid startDate format. Use ISO date format (YYYY-MM-DD)." };
  }
  const endDate = parseDate(filters.endDate, true);
  if (endDate === null) {
    return { error: "Invalid endDate format. Use ISO date format (YYYY-MM-DD)." };
  }
  if (startDate && endDate && startDate > endDate) {
    return { error: "startDate must not be after endDate." };
  }

  return {
    where: {
      reviewerId,
      ...(status ? { status } : {}),
      ...(startDate || endDate
        ? { createdAt: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } }
        : {}),
    },
  };
}

router.get("/summary", async (req, res): Promise<void> => {
  const result = buildReportWhere(req.query, req.user!.id);
  if ("error" in result) {
    res.status(400).json({ error: result.error, code: "VALIDATION_ERROR" });
    return;
  }

  try {
    const requests = await prisma.purchaseRequest.findMany({
      where: result.where,
      select: { status: true, amount: true },
    });
    res.status(200).json(aggregateReportMetrics(requests));
  } catch {
    res.status(500).json({
      error: "Failed to fetch report summary",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

router.get("/requests", async (req, res): Promise<void> => {
  const result = buildReportWhere(req.query, req.user!.id);
  if ("error" in result) {
    res.status(400).json({ error: result.error, code: "VALIDATION_ERROR" });
    return;
  }

  try {
    const requests = await prisma.purchaseRequest.findMany({
      where: result.where,
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ requests });
  } catch {
    res.status(500).json({
      error: "Failed to fetch report requests",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

export default router;
