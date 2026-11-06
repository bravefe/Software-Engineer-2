import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchRequestById,
  fetchRequestHistory,
  PurchaseRequest,
  RequestHistoryEntry,
  reviewPurchaseRequest,
  submitPurchaseRequest,
} from "../api/requests";
import { HistoryTimeline } from "../components/HistoryTimeline";
import { ReviewDecisionModal } from "../components/ReviewDecisionModal";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [history, setHistory] = useState<RequestHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Review modal state
  const [activeDecision, setActiveDecision] = useState<"APPROVE" | "REJECT" | "RETURN" | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const requestId = Number(id);

  const loadData = async () => {
    if (Number.isNaN(requestId)) {
      setErrorMessage("Invalid request ID");
      setIsLoading(false);
      return;
    }

    try {
      const [reqData, histData] = await Promise.all([
        fetchRequestById(requestId),
        fetchRequestHistory(requestId),
      ]);
      setRequest(reqData);
      setHistory(histData);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load request details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [requestId]);

  const handleReviewConfirm = async (reason: string) => {
    if (!activeDecision) return;

    setIsSubmittingReview(true);
    setErrorMessage(null);

    try {
      const updated = await reviewPurchaseRequest(requestId, activeDecision, reason || undefined);
      setRequest(updated);
      setSuccessMessage(`Request successfully ${activeDecision.toLowerCase()}ed.`);
      setActiveDecision(null);
      // Reload history
      const updatedHistory = await fetchRequestHistory(requestId);
      setHistory(updatedHistory);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process review decision");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDraftSubmit = async () => {
    setErrorMessage(null);
    try {
      const updated = await submitPurchaseRequest(requestId);
      setRequest(updated);
      setSuccessMessage("Request successfully submitted for review.");
      const updatedHistory = await fetchRequestHistory(requestId);
      setHistory(updatedHistory);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit request");
    }
  };

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading request details...</span>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {errorMessage || "Purchase request not found."}
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  const isRequesterOwner = user?.id === request.requesterId;
  const isAssignedReviewer = user?.id === request.reviewerId && user?.role === "REVIEWER";
  const canReview = isAssignedReviewer && request.status === "PENDING_REVIEW";
  const canEdit = isRequesterOwner && request.status === "RETURNED";
  const canSubmitDraft = isRequesterOwner && request.status === "DRAFT";

  return (
    <div className="container py-4">
      {/* Messages */}
      {errorMessage && (
        <div className="alert alert-danger alert-dismissible mb-4" role="alert">
          {errorMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setErrorMessage(null)}
            aria-label="Close"
          />
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success alert-dismissible mb-4" role="alert">
          {successMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage(null)}
            aria-label="Close"
          />
        </div>
      )}

      {/* Header card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-light text-dark border fw-mono">
                  {request.requestNumber}
                </span>
                <StatusBadge status={request.status} />
              </div>
              <h1 className="h3 mb-2">{request.title}</h1>
              <p className="text-muted small mb-0">
                Created on {new Date(request.createdAt).toLocaleDateString()} by{" "}
                <strong>{request.requester?.name || `Requester #${request.requesterId}`}</strong>
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2">
              {canEdit && (
                <Link to={`/requests/${request.id}/edit`} className="btn btn-warning">
                  Edit & Resubmit
                </Link>
              )}

              {canSubmitDraft && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleDraftSubmit}
                >
                  Submit for Review
                </button>
              )}

              {canReview && (
                <div className="btn-group">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => setActiveDecision("APPROVE")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setActiveDecision("REJECT")}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={() => setActiveDecision("RETURN")}
                  >
                    Return
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Details */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3">
              <h2 className="h5 mb-0">Request Overview</h2>
            </div>
            <div className="card-body p-4">
              <div className="row mb-3">
                <div className="col-sm-4 text-muted">Amount:</div>
                <div className="col-sm-8 fw-semibold fs-5 text-primary">
                  ${Number(request.amount).toFixed(2)}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-sm-4 text-muted">Assigned Reviewer:</div>
                <div className="col-sm-8">
                  {request.reviewer?.name || `Reviewer #${request.reviewerId}`} (
                  {request.reviewer?.email})
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-sm-4 text-muted">Submission Date:</div>
                <div className="col-sm-8">
                  {request.submittedAt
                    ? new Date(request.submittedAt).toLocaleString()
                    : "Not yet submitted"}
                </div>
              </div>
              <hr />
              <div className="mb-3">
                <h3 className="h6 text-muted mb-2">Description</h3>
                <p className="mb-0 text-break" style={{ whiteSpace: "pre-wrap" }}>
                  {request.description}
                </p>
              </div>
              <hr />
              <div>
                <h3 className="h6 text-muted mb-2">Business Justification</h3>
                <p className="mb-0 text-break" style={{ whiteSpace: "pre-wrap" }}>
                  {request.justification}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Audit History Timeline */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3">
              <h2 className="h5 mb-0">Audit History Timeline</h2>
            </div>
            <div className="card-body p-3">
              <HistoryTimeline history={history} />
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {activeDecision && (
        <ReviewDecisionModal
          decision={activeDecision}
          isOpen={true}
          isSubmitting={isSubmittingReview}
          onConfirm={handleReviewConfirm}
          onClose={() => setActiveDecision(null)}
        />
      )}
    </div>
  );
}
