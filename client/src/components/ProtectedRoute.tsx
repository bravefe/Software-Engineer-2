import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// I AM Not Using this component yet, but I will use it in the future when I implement role-based access control for certain routes. For now, it is a placeholder to show how to protect routes based on user roles.
export interface ProtectedRouteProps {
  allowedRoles?: Array<"REQUESTER" | "REVIEWER">;
  redirectUnauthenticatedTo?: string;
}

export function ProtectedRoute({
  allowedRoles,
  redirectUnauthenticatedTo = "/login",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <p className="container py-5" role="status">
        Checking your session…
      </p>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectUnauthenticatedTo} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <h4>Access Denied</h4>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
