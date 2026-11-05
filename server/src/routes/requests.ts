import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { prisma } from "../prisma";

const router = Router();

// All request endpoints require authentication
router.use(requireAuth);

// GET /api/requests - scoped to role and ownership
router.get("/", async (req, res): Promise<void> => {
  const currentUser = req.user!;

  try {
    const whereClause =
      currentUser.role === "REQUESTER"
        ? { requesterId: currentUser.id }
        : { reviewerId: currentUser.id };

    const requests = await prisma.purchaseRequest.findMany({
      where: whereClause,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch purchase requests",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

// GET /api/requests/:id - individual request ownership and access check
router.get("/:id", async (req, res): Promise<void> => {
  const requestId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(requestId)) {
    res.status(400).json({ error: "Invalid request ID", code: "VALIDATION_ERROR" });
    return;
  }

  const currentUser = req.user!;

  try {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!request) {
      res.status(404).json({ error: "Purchase request not found", code: "NOT_FOUND" });
      return;
    }

    // Requester can only access own request (BR-09, AC-10)
    if (currentUser.role === "REQUESTER" && request.requesterId !== currentUser.id) {
      res.status(403).json({
        error: "Access denied: cannot view another user's request",
        code: "ACCESS_DENIED",
      });
      return;
    }

    // Reviewer can only access assigned request (BR-04, AC-09)
    if (currentUser.role === "REVIEWER" && request.reviewerId !== currentUser.id) {
      res.status(403).json({
        error: "Access denied: request is not assigned to you",
        code: "ACCESS_DENIED",
      });
      return;
    }

    res.status(200).json({ request });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch purchase request",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

// POST /api/requests/:id/review - Reviewer review decision
router.post("/:id/review", requireRole(["REVIEWER"]), async (req, res): Promise<void> => {
  const requestId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(requestId)) {
    res.status(400).json({ error: "Invalid request ID", code: "VALIDATION_ERROR" });
    return;
  }

  const currentUser = req.user!;
  const { decision, reason } = req.body || {};

  if (!decision || !["APPROVE", "REJECT", "RETURN"].includes(decision)) {
    res.status(400).json({
      error: "Valid decision (APPROVE, REJECT, or RETURN) is required",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  try {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      res.status(404).json({ error: "Purchase request not found", code: "NOT_FOUND" });
      return;
    }

    // BR-03 / AC-08: A Requester cannot review or approve their own request
    if (request.requesterId === currentUser.id) {
      res.status(403).json({
        error: "Cannot review or approve your own purchase request",
        code: "SELF_REVIEW_FORBIDDEN",
      });
      return;
    }

    // BR-04 / AC-09: A Reviewer can only review requests assigned to them
    if (request.reviewerId !== currentUser.id) {
      res.status(403).json({
        error: "Reviewer cannot review requests assigned to another reviewer",
        code: "ACCESS_DENIED",
      });
      return;
    }

    // BR-05 / AC-06: Reject or Return requires a reason
    if ((decision === "REJECT" || decision === "RETURN") && (!reason || typeof reason !== "string" || !reason.trim())) {
      res.status(400).json({
        error: "A reason is mandatory when rejecting or returning a request",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    const nextStatus =
      decision === "APPROVE"
        ? "APPROVED"
        : decision === "REJECT"
          ? "REJECTED"
          : "RETURNED";

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.purchaseRequest.update({
        where: { id: requestId },
        data: { status: nextStatus },
      });

      await tx.requestHistory.create({
        data: {
          requestId: request.id,
          actorId: currentUser.id,
          action: decision === "APPROVE" ? "APPROVED" : decision === "REJECT" ? "REJECTED" : "RETURNED",
          fromStatus: request.status,
          toStatus: nextStatus,
          reason: reason?.trim() || null,
        },
      });

      return updatedRequest;
    });

    res.status(200).json({ request: updated });
  } catch (error) {
    res.status(500).json({
      error: "Failed to process review decision",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

export default router;

