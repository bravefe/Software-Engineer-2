export const REQUEST_LIMITS = {
  titleMin: 3,
  titleMax: 150,
  textMax: 2000,
  amountMax: 9999999999.99,
} as const;

export function validateRequestTitle(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length < REQUEST_LIMITS.titleMin) {
    return "Title must be at least 3 characters";
  }
  if (value.length > REQUEST_LIMITS.titleMax) {
    return "Title must not exceed 150 characters";
  }
  return null;
}

export function validateRequestText(value: unknown, fieldLabel: "Description" | "Justification"): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return `${fieldLabel} is required`;
  }
  if (value.length > REQUEST_LIMITS.textMax) {
    return `${fieldLabel} must not exceed 2000 characters`;
  }
  return null;
}

export function parsePositiveAmount(value: unknown): { amount: number; error: null } | { amount: null; error: string } {
  if (value === undefined || value === null || (typeof value !== "string" && typeof value !== "number")) {
    return { amount: null, error: "Amount must be a positive number greater than 0.00" };
  }

  const raw = String(value).trim();
  if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(raw)) {
    return { amount: null, error: "Amount must be numeric with no more than 2 decimal places" };
  }

  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { amount: null, error: "Amount must be a positive number greater than 0.00" };
  }
  if (amount > REQUEST_LIMITS.amountMax) {
    return { amount: null, error: "Amount must not exceed 9999999999.99" };
  }

  return { amount, error: null };
}
