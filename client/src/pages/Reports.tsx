import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createEmptyReportSummary,
  fetchReportRequests,
  fetchReportSummary,
  REPORT_STATUSES,
  ReportSummary,
} from "../api/reports";
import { PurchaseRequest, RequestFilters } from "../api/requests";
import { StatusBadge } from "../components/StatusBadge";

function formatAmount(amount: string | number): string {
  return typeof amount === "number" ? amount.toFixed(2) : amount;
}

// Drafts are private to Requesters, so Reviewer reports never list or count them.
const REVIEWER_REPORT_STATUSES = REPORT_STATUSES.filter((s) => s.value !== "DRAFT");

export default function Reports() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [summary, setSummary] = useState<ReportSummary>(createEmptyReportSummary);
  const [statusFilter, setStatusFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReport = useCallback(async (filters?: RequestFilters) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [nextSummary, nextRequests] = await Promise.all([
        fetchReportSummary(filters),
        fetchReportRequests(filters),
      ]);
      setSummary(nextSummary);
      setRequests(nextRequests);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const handleApplyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    if (startDateFilter && endDateFilter && startDateFilter > endDateFilter) {
      setErrorMessage("Start Date cannot be after End Date.");
      return;
    }
    const filters = {
      status: statusFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    };
    setIsFiltered(Boolean(filters.status || filters.startDate || filters.endDate));
    void loadReport(filters);
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setIsFiltered(false);
    void loadReport();
  };

  return (
    <main className="container py-4">
      <div className="mb-4">
        <h1 className="h3 mb-1">Purchase Request Reports</h1>
        <p className="text-muted mb-0">Summary of requests assigned to you for review</p>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      <section className="card shadow-sm border-0 mb-4" aria-label="Report filters">
        <div className="card-body">
          <form onSubmit={handleApplyFilters}>
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-4">
                <label htmlFor="report-status" className="form-label">
                  Status
                </label>
                <select
                  id="report-status"
                  aria-label="Status filter"
                  className="form-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">All Statuses</option>
                  {REVIEWER_REPORT_STATUSES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label htmlFor="report-start-date" className="form-label">
                  Start Date
                </label>
                <input
                  id="report-start-date"
                  aria-label="Start date"
                  type="date"
                  className="form-control"
                  value={startDateFilter}
                  onChange={(event) => setStartDateFilter(event.target.value)}
                />
              </div>
              <div className="col-12 col-md-3">
                <label htmlFor="report-end-date" className="form-label">
                  End Date
                </label>
                <input
                  id="report-end-date"
                  aria-label="End date"
                  type="date"
                  className="form-control"
                  value={endDateFilter}
                  onChange={(event) => setEndDateFilter(event.target.value)}
                />
              </div>
              <div className="col-12 col-md-2 d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1" id="report-filter-submit">
                  Filter
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  id="report-filter-clear"
                  onClick={handleClearFilters}
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="row g-3 mb-4" aria-label="Request summary">
        <div className="col-12 col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="text-muted">Total Requests</div>
              <div className="display-6" data-testid="report-total-count">
                {isLoading ? "..." : summary.totalCount}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="text-muted">Total Requested Amount</div>
              <div className="display-6" data-testid="report-total-amount">
                {isLoading ? "..." : `$${summary.totalAmount}`}
              </div>
            </div>
          </div>
        </div>
        {REVIEWER_REPORT_STATUSES.map(({ value, label }) => (
          <div className="col-6 col-lg" key={value}>
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <div className="text-muted small">{label}</div>
                <div className="h4 mb-0" data-testid={`report-status-${value}`}>
                  {isLoading ? "..." : summary.statusCounts[value]}
                </div>
                <div className="small text-muted" data-testid={`report-amount-${value}`}>
                  {isLoading ? "..." : `$${summary.statusAmounts[value]}`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section aria-label="Filtered purchase requests">
        {isLoading ? (
          <div className="text-center py-5" role="status">
            <span className="spinner-border text-primary" />
            <span className="visually-hidden">Loading report...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="card shadow-sm border-0 text-center py-5">
            <div className="card-body">
              <h2 className="h5 text-muted">
                {isFiltered ? "No matching purchase requests" : "No purchase requests available"}
              </h2>
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
                    <th scope="col">Status</th>
                    <th scope="col">Created Date</th>
                    <th scope="col" className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="fw-semibold">{request.requestNumber}</td>
                      <td>{request.title}</td>
                      <td>${formatAmount(request.amount)}</td>
                      <td><StatusBadge status={request.status} /></td>
                      <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        <Link to={`/requests/${request.id}`} className="btn btn-sm btn-outline-primary">
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
      </section>
    </main>
  );
}
