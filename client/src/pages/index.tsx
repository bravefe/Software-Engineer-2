import { Link } from "react-router-dom";

export default function HomePage() {
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
