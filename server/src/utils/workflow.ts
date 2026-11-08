export type PurchaseRequestStatusType =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "RETURNED";

export const VALID_STATUS_TRANSITIONS: Record<
  PurchaseRequestStatusType,
  PurchaseRequestStatusType[]
> = {
  DRAFT: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["APPROVED", "REJECTED", "RETURNED"],
  RETURNED: ["PENDING_REVIEW"],
  APPROVED: [],
  REJECTED: [],
};

/**
 * Validates whether a state transition from one PurchaseRequestStatus to another
 * is permitted according to BR-07 lifecycle rules.
 */
export function isValidTransition(
  fromStatus: string,
  toStatus: string
): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[fromStatus as PurchaseRequestStatusType];
  if (!allowed) {
    return false;
  }
  return allowed.includes(toStatus as PurchaseRequestStatusType);
}
