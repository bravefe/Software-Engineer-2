import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const password = process.env.SEED_USER_PASSWORD || "Password123!";

async function main(): Promise<void> {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const users = [
      {
        email: "requester1@macau678.com",
        name: "Alice Requester",
        role: "REQUESTER" as const,
      },
      {
        email: "reviewer1@macau678.com",
        name: "Carol Reviewer",
        role: "REVIEWER" as const,
      },
    ];

    for (const user of users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          role: user.role,
          passwordHash,
          isActive: true,
        },
        create: {
          ...user,
          passwordHash,
          isActive: true,
        },
      });
    }

    console.info(`Seeded ${users.length} users.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Database seeding failed:", error);
  process.exitCode = 1;
});
