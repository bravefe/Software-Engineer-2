import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRequests, PurchaseRequest } from "../api/requests";
import { StatusBadge } from "../components/StatusBadge";

export default function ReviewerQueue() {
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
        if (isMounted) setErrorMessage(err.message || "Failed to load review queue");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const pendingRequests = requests.filter((r) => r.status === "PENDING_REVIEW");
  const completedRequests = requests.filter((r) => r.status !== "PENDING_REVIEW");

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Reviewer Queue</h1>
          <p className="text-muted mb-0">Evaluate purchase requests assigned to your review portfolio</p>
        </div>
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
            <span className="visually-hidden">Loading review queue...</span>
          </div>
        </div>
      ) : requests.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5">
          <div className="card-body">
            <h3 className="h5 text-muted mb-2">No requests assigned to your queue</h3>
            <p className="text-muted mb-0">
              New purchase requests assigned to you will appear here for evaluation.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Pending Review Section */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h2 className="h5 mb-0">
                Action Required ({pendingRequests.length})
              </h2>
            </div>
            {pendingRequests.length === 0 ? (
              <div className="card-body text-center py-4 text-muted">
                No requests currently pending your review.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Request #</th>
                      <th scope="col">Title</th>
                      <th scope="col">Requester</th>
                      <th scope="col">Amount</th>
                      <th scope="col">Status</th>
                      <th scope="col">Submitted</th>
                      <th scope="col" className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <span className="fw-semibold">{req.requestNumber}</span>
                        </td>
                        <td>{req.title}</td>
                        <td>{req.requester?.name || `Requester #${req.requesterId}`}</td>
                        <td className="fw-semibold">${Number(req.amount).toFixed(2)}</td>
                        <td>
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="small text-muted">
                          {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString() : "Draft"}
                        </td>
                        <td className="text-end">
                          <Link to={`/requests/${req.id}`} className="btn btn-sm btn-primary">
                            Review Request
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Past Decisions Section */}
          {completedRequests.length > 0 && (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white py-3">
                <h2 className="h5 mb-0 text-muted">
                  Past Decisions ({completedRequests.length})
                </h2>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Request #</th>
                      <th scope="col">Title</th>
                      <th scope="col">Requester</th>
                      <th scope="col">Amount</th>
                      <th scope="col">Final Status</th>
                      <th scope="col" className="text-end">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedRequests.map((req) => (
                      <tr key={req.id}>
                        <td>{req.requestNumber}</td>
                        <td>{req.title}</td>
                        <td>{req.requester?.name}</td>
                        <td>${Number(req.amount).toFixed(2)}</td>
                        <td>
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="text-end">
                          <Link to={`/requests/${req.id}`} className="btn btn-sm btn-outline-secondary">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
