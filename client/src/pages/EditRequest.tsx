import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchRequestById,
  fetchReviewers,
  PurchaseRequest,
  submitPurchaseRequest,
  updatePurchaseRequest,
  UserSummary,
} from "../api/requests";
import { StatusBadge } from "../components/StatusBadge";

export default function EditRequest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [reviewers, setReviewers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [justification, setJustification] = useState("");
  const [reviewerId, setReviewerId] = useState<string>("");
  const [editReason, setEditReason] = useState("");

  const requestId = Number(id);

  useEffect(() => {
    if (Number.isNaN(requestId)) {
      setErrorMessage("Invalid request ID");
      setIsLoading(false);
      return;
    }

    Promise.all([fetchRequestById(requestId), fetchReviewers()])
      .then(([reqData, revData]) => {
        setRequest(reqData);
        setReviewers(revData);

        setTitle(reqData.title);
        setDescription(reqData.description);
        setAmount(String(reqData.amount));
        setJustification(reqData.justification);
        setReviewerId(String(reqData.reviewerId));
      })
      .catch((err) => {
        setErrorMessage(err.message || "Failed to load request data");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [requestId]);

  const trimmedTitle = title.trim();
  const isTitleValid = trimmedTitle.length >= 3 && trimmedTitle.length <= 150;
  const trimmedDescription = description.trim();
  const isDescriptionValid = trimmedDescription.length > 0 && trimmedDescription.length <= 2000;
  const parsedAmount = Number.parseFloat(amount);
  const isAmountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const trimmedJustification = justification.trim();
  const isJustificationValid = trimmedJustification.length > 0 && trimmedJustification.length <= 2000;
  const isReviewerValid = reviewerId !== "" && !Number.isNaN(Number(reviewerId));

  const isFormValid =
    isTitleValid && isDescriptionValid && isAmountValid && isJustificationValid && isReviewerValid;

  const handleSave = async (shouldResubmit: boolean) => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await updatePurchaseRequest(requestId, {
        title: trimmedTitle,
        description: trimmedDescription,
        amount: parsedAmount,
        justification: trimmedJustification,
        reviewerId: Number(reviewerId),
        reason: editReason.trim() || undefined,
      });

      if (shouldResubmit) {
        await submitPurchaseRequest(requestId, editReason.trim() || "Resubmitted after modification");
      }

      navigate(`/requests/${requestId}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          {errorMessage || "Purchase request not found."}
        </div>
      </div>
    );
  }

  if (request.status !== "RETURNED") {
    return (
      <div className="container py-5">
        <div className="card shadow-sm border-danger">
          <div className="card-body text-center py-5">
            <h3 className="h4 text-danger mb-3">Editing Not Allowed</h3>
            <p className="lead mb-4">
              Only requests in <strong>RETURNED</strong> status can be edited. Current status is{" "}
              <StatusBadge status={request.status} />.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(`/requests/${requestId}`)}
            >
              View Request Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div>
                <h2 className="h4 mb-0">Edit Returned Request</h2>
                <small className="text-muted">{request.requestNumber}</small>
              </div>
              <StatusBadge status={request.status} />
            </div>

            <div className="card-body p-4">
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

              <form onSubmit={(e) => e.preventDefault()}>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <label htmlFor="edit-title" className="form-label">
                      Request Title <span className="text-danger">*</span>
                    </label>
                    <span className="small text-muted">{title.length} / 150</span>
                  </div>
                  <input
                    id="edit-title"
                    name="title"
                    type="text"
                    className={`form-control ${title.length > 0 && !isTitleValid ? "is-invalid" : ""}`}
                    value={title}
                    maxLength={150}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="edit-amount" className="form-label">
                    Estimated Amount ($) <span className="text-danger">*</span>
                  </label>
                  <input
                    id="edit-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={`form-control ${amount.length > 0 && !isAmountValid ? "is-invalid" : ""}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="edit-reviewer" className="form-label">
                    Assigned Reviewer <span className="text-danger">*</span>
                  </label>
                  <select
                    id="edit-reviewer"
                    name="reviewerId"
                    className="form-select"
                    value={reviewerId}
                    onChange={(e) => setReviewerId(e.target.value)}
                    required
                  >
                    {reviewers.map((rev) => (
                      <option key={rev.id} value={rev.id}>
                        {rev.name} ({rev.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <label htmlFor="edit-description" className="form-label">
                      Description <span className="text-danger">*</span>
                    </label>
                    <span className="small text-muted">{description.length} / 2000</span>
                  </div>
                  <textarea
                    id="edit-description"
                    name="description"
                    className="form-control"
                    rows={4}
                    maxLength={2000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <label htmlFor="edit-justification" className="form-label">
                      Business Justification <span className="text-danger">*</span>
                    </label>
                    <span className="small text-muted">{justification.length} / 2000</span>
                  </div>
                  <textarea
                    id="edit-justification"
                    name="justification"
                    className="form-control"
                    rows={3}
                    maxLength={2000}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="edit-notes" className="form-label">
                    Modification Summary / Revision Notes
                  </label>
                  <input
                    id="edit-notes"
                    name="notes"
                    type="text"
                    className="form-control"
                    placeholder="Briefly explain what was modified or attached..."
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                  />
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(`/requests/${requestId}`)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleSave(false)}
                    disabled={!isFormValid || isSubmitting}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSave(true)}
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Saving...
                      </>
                    ) : (
                      "Save & Resubmit for Review"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
