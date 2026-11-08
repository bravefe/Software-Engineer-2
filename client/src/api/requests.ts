export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: "REQUESTER" | "REVIEWER";
}

export interface PurchaseRequest {
  id: number;
  requestNumber: string;
  title: string;
  description: string;
  amount: string | number;
  justification: string;
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "RETURNED";
  requesterId: number;
  reviewerId: number;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requester?: UserSummary;
  reviewer?: UserSummary;
}

export interface RequestHistoryEntry {
  id: number;
  requestId: number;
  actorId: number;
  action: "CREATED" | "SUBMITTED" | "RESUBMITTED" | "EDITED" | "APPROVED" | "REJECTED" | "RETURNED";
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
  createdAt: string;
  actor?: UserSummary;
}

export async function fetchReviewers(): Promise<UserSummary[]> {
  const res = await fetch("/api/users/reviewers", {
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch reviewers");
  }
  const data = await res.json();
  return data.reviewers || [];
}

export async function fetchRequests(): Promise<PurchaseRequest[]> {
  const res = await fetch("/api/requests", {
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch requests");
  }
  const data = await res.json();
  return data.requests || [];
}

export async function fetchRequestById(id: number): Promise<PurchaseRequest> {
  const res = await fetch(`/api/requests/${id}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch purchase request");
  }
  const data = await res.json();
  return data.request;
}

export async function createPurchaseRequest(payload: {
  title: string;
  description: string;
  amount: number;
  justification: string;
  reviewerId: number;
  status?: "DRAFT" | "PENDING_REVIEW";
}): Promise<PurchaseRequest> {
  const res = await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to create purchase request");
  }
  return data.request || data;
}

export async function updatePurchaseRequest(
  id: number,
  payload: {
    title?: string;
    description?: string;
    amount?: number;
    justification?: string;
    reviewerId?: number;
    reason?: string;
  }
): Promise<PurchaseRequest> {
  const res = await fetch(`/api/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to update purchase request");
  }
  return data.request;
}

export async function submitPurchaseRequest(
  id: number,
  reason?: string
): Promise<PurchaseRequest> {
  const res = await fetch(`/api/requests/${id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reason }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to submit purchase request");
  }
  return data.request;
}

export async function reviewPurchaseRequest(
  id: number,
  decision: "APPROVE" | "REJECT" | "RETURN",
  reason?: string
): Promise<PurchaseRequest> {
  const res = await fetch(`/api/requests/${id}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ decision, reason }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to process review decision");
  }
  return data.request;
}

export async function fetchRequestHistory(id: number): Promise<RequestHistoryEntry[]> {
  const res = await fetch(`/api/requests/${id}/history`, {
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch request history");
  }
  const data = await res.json();
  return data.history || [];
}
