import React from "react";

export interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let badgeClass = "badge ";
  let label = status;

  switch (status) {
    case "DRAFT":
      badgeClass += "bg-secondary";
      label = "Draft";
      break;
    case "PENDING_REVIEW":
      badgeClass += "bg-primary";
      label = "Pending Review";
      break;
    case "APPROVED":
      badgeClass += "bg-success";
      label = "Approved";
      break;
    case "REJECTED":
      badgeClass += "bg-danger";
      label = "Rejected";
      break;
    case "RETURNED":
      badgeClass += "bg-warning text-dark";
      label = "Returned";
      break;
    default:
      badgeClass += "bg-secondary";
      label = status;
  }

  return (
    <span className={badgeClass} data-testid={`status-badge-${status.toLowerCase()}`}>
      {label}
    </span>
  );
}
