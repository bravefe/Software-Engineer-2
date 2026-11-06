import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRequests, PurchaseRequest } from "../api/requests";
import { StatusBadge } from "../components/StatusBadge";

export default function RequesterDashboard() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchRequests()
      .then((data) => {
        if (isMounted) setRequests(data);
      })
      .catch((err) => {
        if (isMounted) setErrorMessage(err.message || "Failed to load requests");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">My Purchase Requests</h1>
          <p className="text-muted mb-0">Track and manage your submitted purchase requests</p>
        </div>
        <Link to="/requests/new" className="btn btn-primary">
          + New Request
        </Link>
      </div>

      {errorMessage && (
        <div className="alert alert-danger alert-dismissible" role="alert">
          {errorMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setErrorMessage(null)}
            aria-label="Close"
          />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading requests...</span>
          </div>
        </div>
      ) : requests.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5">
          <div className="card-body">
            <h3 className="h5 text-muted mb-2">No purchase requests submitted yet</h3>
            <p className="text-muted mb-4">Get started by creating your first purchase approval request.</p>
            <Link to="/requests/new" className="btn btn-primary">
              Create First Request
            </Link>
          </div>
        </div>
      ) : (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Request #</th>
                  <th scope="col">Title</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Reviewer</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created Date</th>
                  <th scope="col" className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <span className="fw-semibold">{req.requestNumber}</span>
                    </td>
                    <td>{req.title}</td>
                    <td>${Number(req.amount).toFixed(2)}</td>
                    <td>{req.reviewer?.name || `Reviewer #${req.reviewerId}`}</td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="small text-muted">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <Link to={`/requests/${req.id}`} className="btn btn-outline-primary">
                          View
                        </Link>
                        {req.status === "RETURNED" && (
                          <Link to={`/requests/${req.id}/edit`} className="btn btn-outline-warning">
                            Edit
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
