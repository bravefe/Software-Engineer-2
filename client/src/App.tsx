import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { getHealthStatus, type HealthStatus } from "./api";

function HomePage() {
  return (
    <main className="container py-5">
      <h1 className="mb-3">Macau678 Purchase Approval System</h1>
      <p className="lead">
        The application foundation is ready for the Sprint 1 approval workflow.
      </p>
      <Link className="btn btn-primary" to="/health">
        Check system health
      </Link>
    </main>
  );
}

function HealthPage() {
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
      <Link to="/">Back to home</Link>
    </main>
  );
}

export default function App() {
  return (
    <>
      <nav className="navbar navbar-expand navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand" to="/">
            Macau678
          </Link>
          <div className="navbar-nav">
            <Link className="nav-link" to="/">
              Home
            </Link>
            <Link className="nav-link" to="/health">
              Health
            </Link>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
