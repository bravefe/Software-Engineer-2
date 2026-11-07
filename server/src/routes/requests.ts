import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { prisma } from "../prisma";
import { isValidTransition } from "../utils/workflow";

const router = Router();

// All request endpoints require authentication
router.use(requireAuth);

/**
 * Generate a unique request number in the format PR-YYYY-XXXXX
 */
async function generateUniqueRequestNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.purchaseRequest.count();
  let counter = count + 1;
  let requestNumber = `PR-${year}-${String(counter).padStart(5, "0")}`;

  let existing = await prisma.purchaseRequest.findUnique({
    where: { requestNumber },
  });

  while (existing) {
    counter += 1;
    requestNumber = `PR-${year}-${String(counter).padStart(5, "0")}`;
    existing = await prisma.purchaseRequest.findUnique({
      where: { requestNumber },
    });
  }

  return requestNumber;
}

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

// POST /api/requests - create purchase request (DRAFT or PENDING_REVIEW)
router.post("/", requireRole(["REQUESTER"]), async (req, res): Promise<void> => {
  const currentUser = req.user!;
  const { title, description, amount, justification, reviewerId, status } = req.body || {};

  // Title validation: 3 to 150 characters
  if (!title || typeof title !== "string" || title.trim().length < 3 || title.trim().length > 150) {
    res.status(400).json({
      error: "Title must be between 3 and 150 characters",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  // Description validation: mandatory, up to 2000 characters
  if (!description || typeof description !== "string" || description.trim().length === 0 || description.trim().length > 2000) {
    res.status(400).json({
      error: "Description is required and must not exceed 2000 characters",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  // Amount validation: positive decimal > 0.00
  const parsedAmount = Number.parseFloat(amount);
  if (amount === undefined || amount === null || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({
      error: "Amount must be a positive number greater than 0.00",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  // Justification validation: mandatory, up to 2000 characters
  if (!justification || typeof justification !== "string" || justification.trim().length === 0 || justification.trim().length > 2000) {
    res.status(400).json({
      error: "Justification is required and must not exceed 2000 characters",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  // Reviewer assignment validation
  const parsedReviewerId = Number.parseInt(reviewerId, 10);
  if (Number.isNaN(parsedReviewerId)) {
    res.status(400).json({
      error: "An authorized reviewer must be assigned",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  const assignedReviewer = await prisma.user.findFirst({
    where: {
      id: parsedReviewerId,
      role: "REVIEWER",
      isActive: true,
    },
  });

  if (!assignedReviewer) {
    res.status(400).json({
      error: "Assigned reviewer does not exist or is not an active reviewer",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  const targetStatus = status === "DRAFT" ? "DRAFT" : "PENDING_REVIEW";

  try {
    const requestNumber = await generateUniqueRequestNumber();

    const result = await prisma.$transaction(async (tx) => {
      const createdRequest = await tx.purchaseRequest.create({
        data: {
          requestNumber,
          title: title.trim(),
          description: description.trim(),
          amount: parsedAmount.toFixed(2),
          justification: justification.trim(),
          status: targetStatus,
          requesterId: currentUser.id,
          reviewerId: parsedReviewerId,
          submittedAt: targetStatus === "PENDING_REVIEW" ? new Date() : null,
        },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.requestHistory.create({
        data: {
          requestId: createdRequest.id,
          actorId: currentUser.id,
          action: targetStatus === "DRAFT" ? "CREATED" : "SUBMITTED",
          fromStatus: null,
          toStatus: targetStatus,
          reason: targetStatus === "DRAFT" ? "Draft purchase request created" : "Purchase request submitted for review",
        },
      });

      return createdRequest;
    });

    res.status(201).json({
      ...result,
      request: result,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create purchase request",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

// GET /api/requests/:id - individual request ownership and access check
router.get("/:id", async (req, res): Promise<void> => {
  const requestId = Number.parseInt(String(req.params.id), 10);
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

// PATCH /api/requests/:id - edit request (strictly permitted when status is RETURNED)
router.patch("/:id", requireRole(["REQUESTER"]), async (req, res): Promise<void> => {
  const requestId = Number.parseInt(String(req.params.id), 10);
  if (Number.isNaN(requestId)) {
    res.status(400).json({ error: "Invalid request ID", code: "VALIDATION_ERROR" });
    return;
  }

  const currentUser = req.user!;

  try {
    const existing = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      res.status(404).json({ error: "Purchase request not found", code: "NOT_FOUND" });
      return;
    }

    if (existing.requesterId !== currentUser.id) {
      res.status(403).json({
        error: "Access denied: you can only edit your own requests",
        code: "ACCESS_DENIED",
      });
      return;
    }

    // BR-06 / FR-05: Requesters can only edit requests in RETURNED status
    if (existing.status !== "RETURNED") {
      res.status(409).json({
        error: "Editing is permitted only when request is in RETURNED status",
        code: "INVALID_STATE_TRANSITION",
      });
      return;
    }

    const { title, description, amount, justification, reviewerId } = req.body || {};
    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 150) {
        res.status(400).json({
          error: "Title must be between 3 and 150 characters",
          code: "VALIDATION_ERROR",
        });
        return;
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.trim().length === 0 || description.trim().length > 2000) {
        res.status(400).json({
          error: "Description is required and must not exceed 2000 characters",
          code: "VALIDATION_ERROR",
        });
        return;
      }
      updateData.description = description.trim();
    }

    if (amount !== undefined) {
      const parsedAmount = Number.parseFloat(amount);
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({
          error: "Amount must be a positive number greater than 0.00",
          code: "VALIDATION_ERROR",
        });
        return;
      }
      updateData.amount = parsedAmount.toFixed(2);
    }

    if (justification !== undefined) {
      if (typeof justification !== "string" || justification.trim().length === 0 || justification.trim().length > 2000) {
        res.status(400).json({
          error: "Justification is required and must not exceed 2000 characters",
          code: "VALIDATION_ERROR",
        });
        return;
      }
      updateData.justification = justification.trim();
    }

    if (reviewerId !== undefined) {
      const parsedReviewerId = Number.parseInt(reviewerId, 10);
      const reviewer = await prisma.user.findFirst({
        where: { id: parsedReviewerId, role: "REVIEWER", isActive: true },
      });
      if (!reviewer) {
        res.status(400).json({
          error: "Assigned reviewer does not exist or is inactive",
          code: "VALIDATION_ERROR",
        });
        return;
      }
      updateData.reviewerId = parsedReviewerId;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.purchaseRequest.update({
        where: { id: requestId },
        data: updateData,
        include: {
          requester: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.requestHistory.create({
        data: {
          requestId: existing.id,
          actorId: currentUser.id,
          action: "EDITED",
          fromStatus: existing.status,
          toStatus: existing.status,
          reason: req.body.reason?.trim() || "Request details updated by requester",
        },
      });

      return updatedRequest;
    });

    res.status(200).json({ request: updated });
  } catch (error) {
    res.status(500).json({
      error: "Failed to update purchase request",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

// POST /api/requests/:id/submit - submit a DRAFT or resubmit a RETURNED request
router.post("/:id/submit", requireRole(["REQUESTER"]), async (req, res): Promise<void> => {
  const requestId = Number.parseInt(String(req.params.id), 10);
  if (Number.isNaN(requestId)) {
    res.status(400).json({ error: "Invalid request ID", code: "VALIDATION_ERROR" });
    return;
  }

  const currentUser = req.user!;

  try {
    const existing = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      res.status(404).json({ error: "Purchase request not found", code: "NOT_FOUND" });
      return;
    }

    if (existing.requesterId !== currentUser.id) {
      res.status(403).json({
        error: "Access denied: you can only submit your own requests",
        code: "ACCESS_DENIED",
      });
      return;
    }

    if (existing.status !== "DRAFT" && existing.status !== "RETURNED") {
      res.status(409).json({
        error: `Cannot submit request from status ${existing.status}. Only DRAFT or RETURNED requests can be submitted.`,
        code: "INVALID_STATE_TRANSITION",
      });
      return;
    }

    const action = existing.status === "DRAFT" ? "SUBMITTED" : "RESUBMITTED";

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.purchaseRequest.update({
        where: { id: requestId },
        data: {
          status: "PENDING_REVIEW",
          submittedAt: new Date(),
        },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.requestHistory.create({
        data: {
          requestId: existing.id,
          actorId: currentUser.id,
          action,
          fromStatus: existing.status,
          toStatus: "PENDING_REVIEW",
          reason: req.body?.reason?.trim() || (action === "RESUBMITTED" ? "Request resubmitted after modifications" : "Draft submitted for review"),
        },
      });

      return updatedRequest;
    });

    res.status(200).json({ request: updated });
  } catch (error) {
    res.status(500).json({
      error: "Failed to submit purchase request",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

// POST /api/requests/:id/review - Reviewer review decision
router.post("/:id/review", requireRole(["REVIEWER"]), async (req, res): Promise<void> => {
  const requestId = Number.parseInt(String(req.params.id), 10);
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

    // BR-07: Review decision can only be made on requests pending review
    if (request.status !== "PENDING_REVIEW") {
      res.status(409).json({
        error: `Review decisions can only be made on requests in PENDING_REVIEW status (current: ${request.status})`,
        code: "INVALID_STATE_TRANSITION",
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

    // Validate state transition helper
    if (!isValidTransition(request.status, nextStatus)) {
      res.status(409).json({
        error: `Invalid status transition from ${request.status} to ${nextStatus}`,
        code: "INVALID_STATE_TRANSITION",
      });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.purchaseRequest.update({
        where: { id: requestId },
        data: { status: nextStatus },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
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

// GET /api/requests/:id/history - full audit history timeline
router.get("/:id/history", async (req, res): Promise<void> => {
  const requestId = Number.parseInt(String(req.params.id), 10);
  if (Number.isNaN(requestId)) {
    res.status(400).json({ error: "Invalid request ID", code: "VALIDATION_ERROR" });
    return;
  }

  const currentUser = req.user!;

  try {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      res.status(404).json({ error: "Purchase request not found", code: "NOT_FOUND" });
      return;
    }

    // Access check: only owning requester or assigned reviewer can view history
    if (currentUser.role === "REQUESTER" && request.requesterId !== currentUser.id) {
      res.status(403).json({
        error: "Access denied: cannot view history of another user's request",
        code: "ACCESS_DENIED",
      });
      return;
    }

    if (currentUser.role === "REVIEWER" && request.reviewerId !== currentUser.id) {
      res.status(403).json({
        error: "Access denied: request is not assigned to you",
        code: "ACCESS_DENIED",
      });
      return;
    }

    const history = await prisma.requestHistory.findMany({
      where: { requestId },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).json({ history });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch request history",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

export default router;
