import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useApplicationRuntime } from "../../app/providers";
import type { ChecklistAnswer } from "../../backend/backend";
import { useScenario } from "../../app/scenario-context";
import {
  CommandError,
  errorMessage,
  PageHeader,
  StatusPill,
  WorkspaceShell,
} from "../shared/workspace-shell";

export function ChecklistRunnerPage() {
  const runtime = useApplicationRuntime();
  const { projection, actions } = useScenario();
  const [selectedQuestionId, setSelectedQuestionId] = useState("CAB-EMEQ-PBE-001");
  const [answer, setAnswer] = useState<ChecklistAnswer>("NOT_CHECKED");
  const [comment, setComment] = useState("");
  const [inspectionAttachment, setInspectionAttachment] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void actions.loadPackage().catch((cause) => setError(errorMessage(cause)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!projection.fieldMode || !projection.response) return;
    setAnswer(projection.response.answer);
    setComment(projection.response.comment);
  }, [projection.fieldMode, projection.response]);

  const packageView = projection.packageView;
  const selectedQuestion = packageView?.questions.find(
    (question) => question.id === selectedQuestionId,
  );
  const activeSubjectId = runtime.subjectId ?? "USR-INSPECTOR-AMINA";
  const selectedQuestionAssignedHere = selectedQuestion?.assignedInspectorUserIds.includes(activeSubjectId) ?? false;
  const checklistReadOnly = packageView?.checklistStatus === "SUBMITTED";
  const attachmentRecoveryBlocked = projection.attachmentRecoveryBlocking.length > 0;

  async function run(command: () => Promise<void>): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await command();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceShell roleLabel="CAA Inspector" routeLabel="Checklist Runner">
      <PageHeader
        eyebrow="AUD-2026-001 · Flight Operations"
        title="Cabin Inspection checklist"
        description="Record an answer against the exact assigned question. Exceptions require an Inspector comment."
        action={<StatusPill>{projection.checklistSubmission?.checklistStatus ?? packageView?.checklistStatus ?? "IN_PROGRESS"}</StatusPill>}
      />
      <CommandError message={error} />
      {attachmentRecoveryBlocked ? (
        <section className="decision-result" data-testid="attachment-recovery-blocking" role="alert">
          <strong>Inspection Attachment recovery required</strong>
          <span>
            Referenced local bytes are missing. Editing is blocked; preserve site data and use the
            approved recovery/reselection process.
          </span>
        </section>
      ) : null}
      {projection.attachmentRecoveryQuarantinedCount > 0 ? (
        <p className="decision-result" data-testid="attachment-recovery-quarantine" role="status">
          Quarantined local attachment bytes require review. They were not automatically deleted.
        </p>
      ) : null}
      <div className="split-layout split-layout--questions">
        <section className="question-list" aria-label="Cabin checklist questions">
          {packageView?.questions.map((question) => {
            const assignedHere = question.assignedInspectorUserIds.includes(activeSubjectId);
            return (
              <button
                className={`question-row${selectedQuestionId === question.id ? " question-row--selected" : ""}`}
                data-testid="checklist-question-row"
                disabled={!assignedHere}
                key={question.id}
                onClick={() => assignedHere && setSelectedQuestionId(question.id)}
                type="button"
              >
                <span className="question-row__content" data-testid={`question-${question.id}`}>
                  <span className="question-row__section">{question.sectionId}</span>
                  <strong>{question.prompt}</strong>
                  <span>{assignedHere ? "Assigned to you" : "Assigned to another Inspector — read-only"}</span>
                </span>
              </button>
            );
          })}
        </section>
        <section className="surface-card response-panel">
          {selectedQuestion ? (
            <>
              <p className="eyebrow">{selectedQuestion.id}</p>
              <h2>{selectedQuestion.sectionId}</h2>
              <p>{selectedQuestion.prompt}</p>
              <label>
                Checklist answer
                <select
                  disabled={!selectedQuestionAssignedHere || checklistReadOnly || attachmentRecoveryBlocked}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value as ChecklistAnswer)}
                >
                  {selectedQuestion.allowedAnswers.map((option) => (
                    <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </label>
              <label>
                Inspector comment
                <textarea
                  disabled={!selectedQuestionAssignedHere || checklistReadOnly || attachmentRecoveryBlocked}
                  rows={5}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </label>
              <div className="button-row">
                <button
                  className="primary-button"
                  disabled={busy || !selectedQuestionAssignedHere || checklistReadOnly || attachmentRecoveryBlocked}
                  onClick={() => void run(() => actions.saveChecklistResponse(answer, comment))}
                  type="button"
                >
                  Save response
                </button>
                {projection.response ? (
                  <span data-testid="response-status">{projection.response.answer}</span>
                ) : null}
              </div>
              {projection.fieldMode && projection.response && projection.potentialFinding && !checklistReadOnly ? (
                <section className="attachment-staging" aria-labelledby="inspection-attachment-title">
                  <h3 id="inspection-attachment-title">Inspection Attachment</h3>
                  <p>
                    Stage PDF, JPEG, or PNG bytes against this Potential Finding. Local bytes
                    remain pending until acknowledged by the server.
                  </p>
                  <label>
                    Attachment file
                    <input
                      accept="application/pdf,image/jpeg,image/png"
                      disabled={busy || attachmentRecoveryBlocked}
                      onChange={(event) => setInspectionAttachment(event.target.files?.[0] ?? null)}
                      type="file"
                    />
                  </label>
                  <button
                    className="secondary-button"
                    disabled={busy || !inspectionAttachment || attachmentRecoveryBlocked}
                    onClick={() =>
                      void run(async () => {
                        if (!inspectionAttachment) return;
                        await actions.stageInspectionAttachment(inspectionAttachment);
                        setInspectionAttachment(null);
                      })
                    }
                    type="button"
                  >
                    Stage Inspection Attachment
                  </button>
                  {projection.inspectionAttachments.length > 0 ? (
                    <ul aria-label="Staged inspection attachments">
                      {projection.inspectionAttachments.map((attachment) => (
                        <li key={attachment.attachmentId} data-testid="inspection-attachment-state">
                          <strong>{attachment.fileName}</strong> — {attachment.stagingState}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="muted-note">
                    Clearing this browser&apos;s site data irrecoverably removes local attachment
                    bytes. Automatic local-byte deletion is disabled in this candidate.
                  </p>
                </section>
              ) : null}
              {projection.response && !projection.potentialFinding ? (
                <button
                  className="secondary-button"
                  disabled={busy || !selectedQuestionAssignedHere || checklistReadOnly || attachmentRecoveryBlocked}
                  onClick={() => void run(actions.createPotentialFinding)}
                  type="button"
                >
                  Create Potential Finding
                </button>
              ) : null}
              {projection.potentialFinding ? (
                <div className="decision-result">
                  <span>Potential Finding</span>
                  <strong data-testid="potential-finding-id">{projection.potentialFinding.id}</strong>
                  <span data-testid="potential-finding-status">{projection.potentialFinding.status}</span>
                </div>
              ) : null}
            </>
          ) : <p>Choose an assigned question.</p>}
        </section>
      </div>
      {projection.fieldMode && projection.fieldPendingOperationCount > 0 ? (
        <section className="decision-result" data-testid="field-sync-state" role="status">
          <span>Saved locally — sync pending ({projection.fieldPendingOperationCount})</span>
          <button
            className="secondary-button"
            disabled={busy || projection.fieldSyncStatus === "resnapshot-required"}
            onClick={() => void run(() => actions.syncFieldWork("manual"))}
            type="button"
          >
            Sync now
          </button>
          {projection.fieldSyncErrorCode ? <span>{projection.fieldSyncErrorCode}</span> : null}
        </section>
      ) : null}
      {projection.fieldSyncStatus === "conflict" && projection.fieldSyncConflict ? (
        <section className="decision-result" data-testid="field-sync-conflict" role="alert">
          <strong>Sync conflict — local draft preserved</strong>
          <span>
            {projection.fieldSyncConflict.code} at authoritative revision {projection.fieldSyncConflict.authoritativeRevision ?? "unknown"}.
            Re-enter the decision explicitly against the current server revision; no automatic merge was applied.
          </span>
        </section>
      ) : null}
      {projection.fieldSyncStatus === "resnapshot-required" ? (
        <section className="decision-result" data-testid="field-resnapshot-required" role="alert">
          <strong>Safe package refresh required</strong>
          <span>Editing is blocked. Pending operations and Inspection Attachment bytes were preserved.</span>
        </section>
      ) : null}
      {projection.fieldMode && checklistReadOnly ? (
        <p className="decision-result" data-testid="field-reopen-boundary">
          Reconnect to request a reasoned checklist reopen. Reopen is not an offline command.
        </p>
      ) : null}
      {projection.potentialFinding ? (
        <section className="workflow-footer">
          <div>
            <span>Checklist status</span>
            <strong data-testid="checklist-status">
              {projection.checklistSubmission?.checklistStatus ?? packageView?.checklistStatus}
            </strong>
          </div>
          {!projection.checklistSubmission ? (
            <button
              className="primary-button"
              disabled={busy || attachmentRecoveryBlocked}
              onClick={() => void run(actions.submitChecklist)}
              type="button"
            >
              Submit checklist to Lead Inspector
            </button>
          ) : projection.fieldMode ? (
            <span data-testid="field-submit-status">Saved locally — sync pending</span>
          ) : (
            <Link className="primary-link" to="/lead-inspector/lead-review">
              Switch to Lead Inspector
            </Link>
          )}
        </section>
      ) : null}
    </WorkspaceShell>
  );
}
