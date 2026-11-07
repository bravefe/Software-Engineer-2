import React, { useState } from "react";

export interface ReviewDecisionModalProps {
  decision: "APPROVE" | "REJECT" | "RETURN";
  isOpen?: boolean;
  isSubmitting?: boolean;
  onConfirm?: (reason: string) => void | Promise<void>;
  onClose?: () => void;
}

export function ReviewDecisionModal({
  decision,
  isOpen = true,
  isSubmitting = false,
  onConfirm,
  onClose,
}: ReviewDecisionModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const isReasonMandatory = decision === "REJECT" || decision === "RETURN";
  const isReasonValid = !isReasonMandatory || reason.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReasonValid || isSubmitting) return;
    onConfirm?.(reason.trim());
  };

  let title = "Approve Purchase Request";
  let buttonLabel = "Confirm Approval";
  let buttonVariant = "btn-success";

  if (decision === "REJECT") {
    title = "Reject Purchase Request";
    buttonLabel = "Confirm Rejection";
    buttonVariant = "btn-danger";
  } else if (decision === "RETURN") {
    title = "Return Request for Modification";
    buttonLabel = "Confirm Return";
    buttonVariant = "btn-warning";
  }

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              {onClose && (
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={onClose}
                  disabled={isSubmitting}
                />
              )}
            </div>

            <div className="modal-body">
              <p>
                Are you sure you want to <strong>{decision.toLowerCase()}</strong> this purchase request?
              </p>

              <div className="mb-3">
                <label htmlFor="decision-reason" className="form-label">
                  Reason {isReasonMandatory ? <span className="text-danger">*</span> : "(Optional)"}
                </label>
                <textarea
                  id="decision-reason"
                  name="reason"
                  className="form-control"
                  rows={3}
                  placeholder={
                    isReasonMandatory
                      ? "Please provide a reason explaining this decision..."
                      : "Optional comments..."
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isSubmitting}
                  required={isReasonMandatory}
                />
                {isReasonMandatory && !isReasonValid && (
                  <div className="form-text text-danger">
                    A reason is required before submitting.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {onClose && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className={`btn ${buttonVariant}`}
                disabled={!isReasonValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  buttonLabel
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
