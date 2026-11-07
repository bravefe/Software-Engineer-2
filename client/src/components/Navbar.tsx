import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, isAuthenticated, isLoading, authError, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">
          Macau678
        </Link>
        <div className="navbar-nav me-auto">
          <Link className="nav-link" to="/">
            Home
          </Link>
          <Link className="nav-link" to="/health">
            Health
          </Link>

          {isAuthenticated && user?.role === "REQUESTER" && (
            <>
              <Link className="nav-link" to="/requests">
                My Requests
              </Link>
              <Link className="nav-link" to="/requests/new">
                New Request
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === "REVIEWER" && (
            <>
              <Link className="nav-link" to="/reviewer/queue">
                Review Queue
              </Link>
              <Link className="nav-link" to="/reports">
                Reports
              </Link>
            </>
          )}
        </div>

        <div className="navbar-nav">
          {authError && (
            <span className="navbar-text text-warning" role="alert">
              {authError}
            </span>
          )}
          {isLoading ? null : isAuthenticated && user ? (
            <div className="d-flex align-items-center gap-2">
              <span className="navbar-text text-white">
                {user.name} ({user.role})
              </span>
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => {
                  void logout().catch(() => undefined);
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link className="btn btn-outline-light btn-sm" to="/login">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
