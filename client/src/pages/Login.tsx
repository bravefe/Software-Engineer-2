import React, { useState } from "react";
import { login as loginWithCredentials } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({
  onLoginSuccess,
}: {
  onLoginSuccess?: () => void;
}) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithCredentials(email.trim(), password);
      login(user);
      onLoginSuccess?.();
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to connect to authentication server",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-5" style={{ maxWidth: "450px" }}>
      <h1 className="mb-4 text-center">Sign In</h1>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="emailInput">
            Email address
          </label>
          <input
            id="emailInput"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="user@macau678.com"
          />
        </div>
        <div className="mb-4">
          <label className="form-label" htmlFor="passwordInput">
            Password
          </label>
          <input
            id="passwordInput"
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}
