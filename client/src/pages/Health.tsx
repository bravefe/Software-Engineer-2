import { useEffect, useState } from "react";
import { getHealthStatus, type HealthStatus } from "../api/health";

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getHealthStatus()
      .then((result) => {
        if (active) {
          setHealth(result);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "Health check failed.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="container py-5">
      <h1 className="mb-4">System health</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {!error && !health && <p role="status">Checking API and database…</p>}
      {health && (
        <div className="alert alert-success">
          API: {health.status}; database: {health.database}.
        </div>
      )}
    </main>
  );
}
