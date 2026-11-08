import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPurchaseRequest, fetchReviewers, UserSummary } from "../api/requests";

export interface CreateRequestProps {
  initialReviewers?: UserSummary[];
  onSuccess?: (requestId: number) => void;
}

export default function CreateRequest({ initialReviewers, onSuccess }: CreateRequestProps) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [justification, setJustification] = useState("");
  const [reviewerId, setReviewerId] = useState<string>("");

  const [reviewers, setReviewers] = useState<UserSummary[]>(initialReviewers || []);
  const [isLoadingReviewers, setIsLoadingReviewers] = useState(!initialReviewers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialReviewers && initialReviewers.length > 0) {
      setReviewers(initialReviewers);
      if (!reviewerId && initialReviewers[0]) {
        setReviewerId(String(initialReviewers[0].id));
      }
      return;
    }

    let isMounted = true;
    fetchReviewers()
      .then((data) => {
        if (!isMounted) return;
        setReviewers(data);
        if (data.length > 0) {
          setReviewerId(String(data[0].id));
        }
      })
      .catch((err) => {
        if (isMounted) setErrorMessage(err.message || "Failed to load reviewers");
      })
      .finally(() => {
        if (isMounted) setIsLoadingReviewers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialReviewers]);

  // Validation rules
  const trimmedTitle = title.trim();
  const isTitleValid = trimmedTitle.length >= 3 && trimmedTitle.length <= 150;
  const isTitleStarted = title.length > 0;
  const showTitleError = isTitleStarted && !isTitleValid;

  const trimmedDescription = description.trim();
  const isDescriptionValid = trimmedDescription.length > 0 && trimmedDescription.length <= 2000;

  const parsedAmount = Number.parseFloat(amount);
  const isAmountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const isAmountStarted = amount.length > 0;
  const showAmountError = isAmountStarted && !isAmountValid;

  const trimmedJustification = justification.trim();
  const isJustificationValid = trimmedJustification.length > 0 && trimmedJustification.length <= 2000;

  const isReviewerValid = reviewerId !== "" && !Number.isNaN(Number(reviewerId));

  const isFormValid =
    isTitleValid && isDescriptionValid && isAmountValid && isJustificationValid && isReviewerValid;

  const handleSubmit = async (targetStatus: "DRAFT" | "PENDING_REVIEW") => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await createPurchaseRequest({
        title: trimmedTitle,
        description: trimmedDescription,
        amount: parsedAmount,
        justification: trimmedJustification,
        reviewerId: Number(reviewerId),
        status: targetStatus,
      });

      if (onSuccess) {
        onSuccess(created.id);
      } else {
        navigate(`/requests/${created.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3">
              <h2 className="h4 mb-0">Create Purchase Request</h2>
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
                {/* Title */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <label htmlFor="request-title" className="form-label">
                      Request Title <span className="text-danger">*</span>
                    </label>
                    <span className="small text-muted">{title.length} / 150</span>
                  </div>
                  <input
                    id="request-title"
                    name="title"
                    type="text"
                    className={`form-control ${showTitleError ? "is-invalid" : ""}`}
                    placeholder="e.g. Ergonomic Office Chairs for Engineering"
                    value={title}
                    maxLength={150}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  {showTitleError && (
                    <div className="invalid-feedback">
                      Title must be at least 3 characters and at most 150 characters.
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="mb-3">
                  <label htmlFor="request-amount" className="form-label">
                    Estimated Amount ($) <span className="text-danger">*</span>
                  </label>
                  <input
                    id="request-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={`form-control ${showAmountError ? "is-invalid" : ""}`}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  {showAmountError && (
                    <div className="invalid-feedback">
                      Amount must be a positive number greater than 0.00.
                    </div>
                  )}
                </div>

                {/* Assigned Reviewer */}
                <div className="mb-3">
                  <label htmlFor="request-reviewer" className="form-label">
                    Assign Reviewer <span className="text-danger">*</span>
                  </label>
                  {isLoadingReviewers ? (
                    <div className="text-muted small">Loading eligible reviewers...</div>
                  ) : (
                    <select
                      id="request-reviewer"
                      name="reviewerId"
                      className="form-select"
                      value={reviewerId}
                      onChange={(e) => setReviewerId(e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Select a reviewer
                      </option>
                      {reviewers.map((rev) => (
                        <option key={rev.id} value={rev.id}>
                          {rev.name} ({rev.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Description */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <label htmlFor="request-description" className="form-label">
                      Description <span className="text-danger">*</span>
                    </label>
                    <span className="small text-muted">{description.length} / 2000</span>
                  </div>
                  <textarea
                    id="request-description"
                    name="description"
                    className="form-control"
                    rows={4}
                    maxLength={2000}
                    placeholder="Detailed item specifications, quantities, and requirements..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                {/* Justification */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <label htmlFor="request-justification" className="form-label">
                      Business Justification <span className="text-danger">*</span>
                    </label>
                    <span className="small text-muted">{justification.length} / 2000</span>
                  </div>
                  <textarea
                    id="request-justification"
                    name="justification"
                    className="form-control"
                    rows={3}
                    maxLength={2000}
                    placeholder="Why is this purchase required? What project or objective does it support?"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleSubmit("DRAFT")}
                    disabled={!isFormValid || isSubmitting}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSubmit("PENDING_REVIEW")}
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Submitting...
                      </>
                    ) : (
                      "Submit for Review"
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

export const CreateRequestPage = CreateRequest;
