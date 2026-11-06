import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../prisma";

const router = Router();

router.use(requireAuth);

/**
 * GET /api/users/reviewers
 * Retrieves all active Reviewers eligible for request assignment (FR-07, BR-02).
 */
router.get("/reviewers", async (_req, res): Promise<void> => {
  try {
    const reviewers = await prisma.user.findMany({
      where: {
        role: "REVIEWER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    res.status(200).json({ reviewers });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch reviewers",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

export default router;
