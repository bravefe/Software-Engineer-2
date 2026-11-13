import { prisma } from "../../server/src/prisma";
import { hashPassword } from "../../server/src/utils/auth";

export interface SeededTestUsers {
  requester1: {
    id: number;
    email: string;
    name: string;
    role: "REQUESTER";
    password: string;
  };
  requester2: {
    id: number;
    email: string;
    name: string;
    role: "REQUESTER";
    password: string;
  };
  reviewer1: {
    id: number;
    email: string;
    name: string;
    role: "REVIEWER";
    password: string;
  };
  reviewer2: {
    id: number;
    email: string;
    name: string;
    role: "REVIEWER";
    password: string;
  };
  inactiveUser: {
    id: number;
    email: string;
    name: string;
    role: "REQUESTER";
    password: string;
  };
}

export interface SeededTestRequests {
  request1: {
    id: number;
    requestNumber: string;
    requesterId: number;
    reviewerId: number;
  };
  request2: {
    id: number;
    requestNumber: string;
    requesterId: number;
    reviewerId: number;
  };
  selfReviewRequest: {
    id: number;
    requestNumber: string;
    requesterId: number;
    reviewerId: number;
  };
  requestForReject: {
    id: number;
    requestNumber: string;
    requesterId: number;
    reviewerId: number;
  };
  requestForReturn: {
    id: number;
    requestNumber: string;
    requesterId: number;
    reviewerId: number;
  };
}

export async function resetAndSeedDatabase(): Promise<{
  users: SeededTestUsers;
  requests: SeededTestRequests;
}> {
  // Clear existing operational data
  await prisma.session.deleteMany({});
  await prisma.requestHistory.deleteMany({});
  await prisma.purchaseRequest.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = "Password123!";
  const passwordHash = await hashPassword(defaultPassword);

  const req1 = await prisma.user.create({
    data: {
      email: "requester1@macau678.com",
      name: "Alice Requester",
      role: "REQUESTER",
      passwordHash,
      isActive: true,
    },
  });

  const req2 = await prisma.user.create({
    data: {
      email: "requester2@macau678.com",
      name: "Bob Requester",
      role: "REQUESTER",
      passwordHash,
      isActive: true,
    },
  });

  const rev1 = await prisma.user.create({
    data: {
      email: "reviewer1@macau678.com",
      name: "Carol Reviewer",
      role: "REVIEWER",
      passwordHash,
      isActive: true,
    },
  });

  const rev2 = await prisma.user.create({
    data: {
      email: "reviewer2@macau678.com",
      name: "Dave Reviewer",
      role: "REVIEWER",
      passwordHash,
      isActive: true,
    },
  });

  const inactive = await prisma.user.create({
    data: {
      email: "inactive@macau678.com",
      name: "Inactive User",
      role: "REQUESTER",
      passwordHash,
      isActive: false,
    },
  });

  // Create sample requests
  const r1 = await prisma.purchaseRequest.create({
    data: {
      requestNumber: "PR-2026-00001",
      title: "Lab Equipment",
      description: "Sensors and microcontrollers",
      amount: "500.00",
      justification: "Required for experiment",
      status: "PENDING_REVIEW",
      requesterId: req1.id,
      reviewerId: rev1.id,
    },
  });

  const r2 = await prisma.purchaseRequest.create({
    data: {
      requestNumber: "PR-2026-00002",
      title: "Office Stationery",
      description: "Paper and pens",
      amount: "150.00",
      justification: "Department supplies",
      status: "PENDING_REVIEW",
      requesterId: req2.id,
      reviewerId: rev2.id,
    },
  });

  // Request where requester is also reviewer1 (to test BR-03 anti-self-approval)
  const rSelf = await prisma.purchaseRequest.create({
    data: {
      requestNumber: "PR-2026-00003",
      title: "Reviewer's Own Request",
      description: "Testing anti-self-approval rule",
      amount: "300.00",
      justification: "Validation rule testing",
      status: "PENDING_REVIEW",
      requesterId: rev1.id,
      reviewerId: rev1.id,
    },
  });

  const rReject = await prisma.purchaseRequest.create({
    data: {
      requestNumber: "PR-2026-00004",
      title: "Request to Reject",
      description: "Testing rejection workflow and reason requirements",
      amount: "800.00",
      justification: "Rejection testing",
      status: "PENDING_REVIEW",
      requesterId: req1.id,
      reviewerId: rev1.id,
    },
  });

  const rReturn = await prisma.purchaseRequest.create({
    data: {
      requestNumber: "PR-2026-00005",
      title: "Request to Return",
      description: "Testing return workflow and reason requirements",
      amount: "400.00",
      justification: "Return testing",
      status: "PENDING_REVIEW",
      requesterId: req1.id,
      reviewerId: rev1.id,
    },
  });

  return {
    users: {
      requester1: { ...req1, role: "REQUESTER", password: defaultPassword },
      requester2: { ...req2, role: "REQUESTER", password: defaultPassword },
      reviewer1: { ...rev1, role: "REVIEWER", password: defaultPassword },
      reviewer2: { ...rev2, role: "REVIEWER", password: defaultPassword },
      inactiveUser: {
        ...inactive,
        role: "REQUESTER",
        password: defaultPassword,
      },
    },
    requests: {
      request1: {
        id: r1.id,
        requestNumber: r1.requestNumber,
        requesterId: r1.requesterId,
        reviewerId: r1.reviewerId,
      },
      request2: {
        id: r2.id,
        requestNumber: r2.requestNumber,
        requesterId: r2.requesterId,
        reviewerId: r2.reviewerId,
      },
      selfReviewRequest: {
        id: rSelf.id,
        requestNumber: rSelf.requestNumber,
        requesterId: rSelf.requesterId,
        reviewerId: rSelf.reviewerId,
      },
      requestForReject: {
        id: rReject.id,
        requestNumber: rReject.requestNumber,
        requesterId: rReject.requesterId,
        reviewerId: rReject.reviewerId,
      },
      requestForReturn: {
        id: rReturn.id,
        requestNumber: rReturn.requestNumber,
        requesterId: rReturn.requesterId,
        reviewerId: rReturn.reviewerId,
      },
    },
  };
}
