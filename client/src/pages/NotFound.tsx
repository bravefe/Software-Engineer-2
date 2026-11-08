import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="container py-5">
      <h1 className="mb-3">Page not found</h1>
      <p>The requested page does not exist.</p>
      <Link to="/">Return home</Link>
    </main>
  );
}
