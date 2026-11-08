import React from "react";
import { RequestHistoryEntry } from "../api/requests";
import { StatusBadge } from "./StatusBadge";

export interface HistoryTimelineProps {
  history: RequestHistoryEntry[];
}

export function HistoryTimeline({ history }: HistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="alert alert-light border text-muted">
        No history entries recorded yet.
      </div>
    );
  }

  return (
    <div className="timeline" data-testid="history-timeline">
      <ul className="list-group list-group-flush">
        {history.map((entry) => {
          let badgeVariant = "bg-primary";
          if (entry.action === "APPROVED") badgeVariant = "bg-success";
          if (entry.action === "REJECTED") badgeVariant = "bg-danger";
          if (entry.action === "RETURNED") badgeVariant = "bg-warning text-dark";
          if (entry.action === "CREATED" || entry.action === "EDITED") badgeVariant = "bg-secondary";

          return (
            <li
              key={entry.id}
              className="list-group-item py-3 px-0 border-bottom"
              data-testid={`history-entry-${entry.id}`}
            >
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div>
                  <span className={`badge ${badgeVariant} me-2`} data-testid={`action-badge-${entry.action}`}>
                    {entry.action}
                  </span>
                  <strong>{entry.actor?.name || `User #${entry.actorId}`}</strong>
                  {entry.actor?.role && (
                    <span className="text-muted ms-1 small">({entry.actor.role})</span>
                  )}
                </div>
                <small className="text-muted">
                  {new Date(entry.createdAt).toLocaleString()}
                </small>
              </div>

              {(entry.fromStatus || entry.toStatus) && (
                <div className="small text-muted mb-1">
                  Status:{" "}
                  {entry.fromStatus ? <StatusBadge status={entry.fromStatus} /> : <span>None</span>}
                  {" → "}
                  {entry.toStatus ? <StatusBadge status={entry.toStatus} /> : <span>None</span>}
                </div>
              )}

              {entry.reason && (
                <div className="p-2 mt-2 bg-light rounded border-start border-3 border-secondary small text-dark">
                  <strong>Note / Reason:</strong> {entry.reason}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Named alias matching STS specification
export const RequestHistoryTimeline = HistoryTimeline;
