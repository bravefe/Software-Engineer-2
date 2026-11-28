import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRequests, PurchaseRequest, RequestFilters } from "../api/requests";
import { StatusBadge } from "../components/StatusBadge";

export default function RequesterDashboard() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);

  const loadRequests = useCallback(async (filters?: RequestFilters) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchRequests(filters);
      setRequests(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load requests");
    } finally {
      setIsLoading(false);
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
    const hasFilter = Boolean(statusFilter || startDateFilter || endDateFilter || searchFilter.trim());
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

      {/* Filter Controls Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form onSubmit={handleApplyFilters} data-testid="filter-form">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-3">
                <label htmlFor="filter-status" className="form-label small fw-semibold">
                  Status
                </label>
                <select
                  id="filter-status"
                  aria-label="Status filter"
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="RETURNED">Returned</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>

              <div className="col-12 col-md-2">
                <label htmlFor="filter-start-date" className="form-label small fw-semibold">
                  Start Date
                </label>
                <input
                  type="date"
                  id="filter-start-date"
                  aria-label="Start date"
                  className="form-control"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-2">
                <label htmlFor="filter-end-date" className="form-label small fw-semibold">
                  End Date
                </label>
                <input
                  type="date"
                  id="filter-end-date"
                  aria-label="End date"
                  className="form-control"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label htmlFor="filter-search" className="form-label small fw-semibold">
                  Keyword Search
                </label>
                <input
                  type="text"
                  id="filter-search"
                  aria-label="Keyword search"
                  className="form-control"
                  placeholder="Search title or request #"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-2 d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1" id="filter-submit-btn">
                  Filter
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  id="filter-clear-btn"
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
            <span className="visually-hidden">Loading requests...</span>
          </div>
        </div>
      ) : requests.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5">
          <div className="card-body">
            {isFiltered ? (
              <>
                <h3 className="h5 text-muted mb-2">No matching purchase requests</h3>
                <p className="text-muted mb-4">No purchase requests match your selected filter criteria.</p>
                <button type="button" className="btn btn-outline-primary" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <h3 className="h5 text-muted mb-2">No purchase requests submitted yet</h3>
                <p className="text-muted mb-4">Get started by creating your first purchase approval request.</p>
                <Link to="/requests/new" className="btn btn-primary">
                  Create First Request
                </Link>
              </>
            )}
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
                        {(req.status === "DRAFT" || req.status === "RETURNED" || req.status === "PENDING_REVIEW") && (
                          <Link to={`/requests/${req.id}/edit`} className="btn btn-outline-warning">
                            {req.status === "DRAFT"
                              ? "Edit Draft"
                              : req.status === "RETURNED"
                                ? "Edit"
                                : "Edit Pending"}
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
