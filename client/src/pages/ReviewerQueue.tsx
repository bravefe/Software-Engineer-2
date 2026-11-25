import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchRequests,
  PurchaseRequest,
  RequestFilters,
} from "../api/requests";
import { StatusBadge } from "../components/StatusBadge";

export default function ReviewerQueue() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMounted = useRef(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadRequests = useCallback(async (filters?: RequestFilters) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchRequests(filters);
      if (isMounted.current) setRequests(data);
    } catch (err: any) {
      if (isMounted.current)
        setErrorMessage(err.message || "Failed to load review queue");
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (startDateFilter && endDateFilter && startDateFilter > endDateFilter) {
      setErrorMessage("Start Date cannot be after End Date.");
      return;
    }
    const hasFilter = Boolean(
      statusFilter || startDateFilter || endDateFilter || searchFilter.trim(),
    );
    setIsFiltered(hasFilter);
    loadRequests({
      status: statusFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
      search: searchFilter.trim() || undefined,
    });
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setSearchFilter("");
    setIsFiltered(false);
    setErrorMessage(null);
    loadRequests();
  };

  const visibleRequests = requests.filter((r) => r.status !== "DRAFT");
  const pendingRequests = visibleRequests.filter(
    (r) => r.status === "PENDING_REVIEW",
  );
  const completedRequests = visibleRequests.filter(
    (r) => r.status !== "PENDING_REVIEW",
  );

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Reviewer Queue</h1>
          <p className="text-muted mb-0">
            Evaluate purchase requests assigned to your review portfolio
          </p>
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

      {/* Filter Controls Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form
            onSubmit={handleApplyFilters}
            data-testid="reviewer-filter-form"
          >
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-3">
                <label
                  htmlFor="reviewer-filter-status"
                  className="form-label small fw-semibold"
                >
                  Status
                </label>
                <select
                  id="reviewer-filter-status"
                  aria-label="Status filter"
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="RETURNED">Returned</option>
                </select>
              </div>

              <div className="col-12 col-md-2">
                <label
                  htmlFor="reviewer-filter-start-date"
                  className="form-label small fw-semibold"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  id="reviewer-filter-start-date"
                  aria-label="Start date"
                  className="form-control"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-2">
                <label
                  htmlFor="reviewer-filter-end-date"
                  className="form-label small fw-semibold"
                >
                  End Date
                </label>
                <input
                  type="date"
                  id="reviewer-filter-end-date"
                  aria-label="End date"
                  className="form-control"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label
                  htmlFor="reviewer-filter-search"
                  className="form-label small fw-semibold"
                >
                  Keyword Search
                </label>
                <input
                  type="text"
                  id="reviewer-filter-search"
                  aria-label="Keyword search"
                  className="form-control"
                  placeholder="Search title or request #"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-2 d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary flex-grow-1"
                  id="reviewer-filter-submit-btn"
                >
                  Filter
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  id="reviewer-filter-clear-btn"
                  onClick={handleClearFilters}
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading review queue...</span>
          </div>
        </div>
      ) : visibleRequests.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5">
          <div className="card-body">
            {isFiltered ? (
              <>
                <h3 className="h5 text-muted mb-2">
                  No matching purchase requests
                </h3>
                <p className="text-muted mb-4">
                  No requests match your selected filter criteria.
                </p>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <h3 className="h5 text-muted mb-2">
                  No requests assigned to your queue
                </h3>
                <p className="text-muted mb-0">
                  New purchase requests assigned to you will appear here for
                  evaluation.
                </p>
              </>
            )}
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
                {isFiltered
                  ? "No pending requests match the filter criteria."
                  : "No requests currently pending your review."}
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
                      <th scope="col" className="text-end">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <span className="fw-semibold">
                            {req.requestNumber}
                          </span>
                        </td>
                        <td>{req.title}</td>
                        <td>
                          {req.requester?.name ||
                            `Requester #${req.requesterId}`}
                        </td>
                        <td className="fw-semibold">
                          ${Number(req.amount).toFixed(2)}
                        </td>
                        <td>
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="small text-muted">
                          {req.submittedAt
                            ? new Date(req.submittedAt).toLocaleDateString()
                            : "Draft"}
                        </td>
                        <td className="text-end">
                          <Link
                            to={`/requests/${req.id}`}
                            className="btn btn-sm btn-primary"
                          >
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
                      <th scope="col" className="text-end">
                        Details
                      </th>
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
                          <Link
                            to={`/requests/${req.id}`}
                            className="btn btn-sm btn-outline-secondary"
                          >
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
