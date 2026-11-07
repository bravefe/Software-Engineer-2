import { useEffect, useState } from "react";
import {
  getHealthStatus,
  getRoleHealthResults,
  type HealthStatus,
  type RoleHealthResult,
} from "../api/health";

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [results, setResults] = useState<RoleHealthResult[] | null>(null);

  useEffect(() => {
    let active = true;

    getHealthStatus()
      .then((status) => {
        if (active) {
          setHealth(status);
          setHealthError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setHealthError(
            cause instanceof Error ? cause.message : "Health check failed.",
          );
        }
      });

    getRoleHealthResults()
      .then((roleResults) => {
        if (active) {
          setResults(roleResults);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setResults([
            {
              role: "REQUESTER",
              error:
                cause instanceof Error
                  ? cause.message
                  : "Health check failed.",
            },
            {
              role: "REVIEWER",
              error:
                cause instanceof Error
                  ? cause.message
                  : "Health check failed.",
            },
          ]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="container py-5">
      <h1 className="mb-4">System health</h1>
      <section aria-label="Public health" className="mb-3">
        <h2 className="h5">Public API</h2>
        {healthError && (
          <div className="alert alert-danger" role="status">
            {healthError}
          </div>
        )}
        {health && (
          <div
            className={`alert ${
              health.status === "ok" ? "alert-success" : "alert-danger"
            }`}
            role="status"
          >
            {health.status === "error"
              ? health.message || "API or database connection is unavailable."
              : `API: ${health.status}; database: ${health.database}.`}
          </div>
        )}
        {!health && !healthError && (
          <p role="status">Checking public API health…</p>
        )}
      </section>
      {!results && <p role="status">Checking role-specific API health…</p>}
      {results?.map(({ role, status, error }) => (
        <section key={role} aria-label={`${role} health`} className="mb-3">
          <h2 className="h5">{role} API</h2>
          {error && (
            <div className="alert alert-warning" role="status">
              {error}
            </div>
          )}
          {status && (
            <div
              className={`alert ${
                status.status === "ok" ? "alert-success" : "alert-danger"
              }`}
              role="status"
            >
              API: {status.status}; database: {status.database}.
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
