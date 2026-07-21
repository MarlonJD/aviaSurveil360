import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useApplicationRuntime } from "../../app/providers";
import type { ChecklistAnswer } from "../../backend/backend";
import { useScenario } from "../../app/scenario-context";
import { RoleHandoff } from "../../auth/role-handoff";
import { useOptionalSession } from "../../auth/session-provider";
import { DueState } from "../../ui/workbench/due-state";
import { PageHeader } from "../../ui/workbench/page-header";
import { StatusPill } from "../../ui/workbench/status-pill";
import { createRoleEntryPath } from "../../ui/role-select-page";
import { CommandError, errorMessage, WorkspaceShell } from "../shared/workspace-shell";

const canonicalAuditDueDate = "2026-06-18";

function answerLabel(answer: ChecklistAnswer): string {
  return answer.replaceAll("_", " ");
}

function responseStateLabel({
  answer,
  fieldMode,
  pendingCount,
}: {
  answer: ChecklistAnswer;
  fieldMode: boolean;
  pendingCount: number;
}): string {
  if (!fieldMode) return `Server acknowledged - ${answerLabel(answer)}`;
  if (pendingCount > 0) return `Saved locally - sync pending - ${answerLabel(answer)}`;
  return `Server acknowledged - ${answerLabel(answer)}`;
}

export function ChecklistRunnerPage() {
  const runtime = useApplicationRuntime();
  const session = useOptionalSession();
  const navigate = useNavigate();
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
  const commentRequired = selectedQuestion?.commentRequiredFor.includes(answer) ?? false;
  const responseState = projection.response
    ? responseStateLabel({
        answer: projection.response.answer,
        fieldMode: projection.fieldMode,
        pendingCount: projection.fieldPendingOperationCount,
      })
    : null;
  const answeredCount = projection.response ? 1 : 0;
  const questionCount = packageView?.questions.length ?? 6;
  const progress = questionCount > 0 ? Math.round((answeredCount / questionCount) * 100) : 0;
  const identityMode =
    session?.identityMode ??
    (runtime.buildProfile === "http" ? "canonical-test-role-switch" : "demo-role-switch");

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

  function saveResponse(): void {
    if (commentRequired && !comment.trim()) {
      setError("Inspector comment is required");
      return;
    }
    void run(() => actions.saveChecklistResponse(answer, comment));
  }

  return (
    <WorkspaceShell roleLabel="CAA Inspector" routeLabel="Checklist Runner">
      <PageHeader
        eyebrow="Fly Namibia - AUD-2026-001"
        title="Cabin Inspection checklist"
        description="Record an answer against the exact assigned question. Exceptions require an Inspector comment."
        facts={[
          { label: "Current owner", value: "CAA Inspector" },
          { label: "Next action", value: projection.potentialFinding ? "Submit to Lead Inspector" : "Choose an answer" },
          {
            label: "Status",
            value: projection.checklistSubmission?.checklistStatus ?? packageView?.checklistStatus ?? "IN_PROGRESS",
          },
          { label: "Due Date", value: <DueState dueDate={canonicalAuditDueDate} today="2026-06-15" /> },
        ]}
        primaryAction={
          <StatusPill
            label={projection.checklistSubmission?.checklistStatus ?? packageView?.checklistStatus ?? "IN_PROGRESS"}
            tone={projection.checklistSubmission ? "success" : "warning"}
          />
        }
      />
      <CommandError message={error} />
      <section className="inspector-progress-band" aria-label="Checklist progress">
        <strong>
          {answeredCount} of {questionCount} answered
        </strong>
        <div className="inspector-progress-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p>
          Demo scenario: mark EM EQ / PBE serviceability as Non-Compliant, add the
          required Inspector comment, and create the Potential Finding for Lead review.
        </p>
      </section>
      {attachmentRecoveryBlocked ? (
        <section className="inspector-sync-panel" data-testid="attachment-recovery-blocking" role="alert">
          <strong>Inspection Attachment recovery required</strong>
          <span>
            Referenced local bytes are missing. Editing is blocked; preserve site data and use the
            approved recovery/reselection process.
          </span>
        </section>
      ) : null}
      {projection.attachmentRecoveryQuarantinedCount > 0 ? (
        <p className="inspector-sync-panel" data-testid="attachment-recovery-quarantine" role="status">
          Quarantined local attachment bytes require review. They were not automatically deleted.
        </p>
      ) : null}
      <div className="inspector-checklist-grid">
        <section className="inspector-question-list" aria-label="Cabin checklist questions">
          {packageView?.questions.map((question) => {
            const assignedHere = question.assignedInspectorUserIds.includes(activeSubjectId);
            return (
              <button
                aria-pressed={selectedQuestionId === question.id}
                className={`inspector-question-button${selectedQuestionId === question.id ? " inspector-question-button--selected" : ""}`}
                data-testid="checklist-question-row"
                disabled={!assignedHere}
                key={question.id}
                onClick={() => assignedHere && setSelectedQuestionId(question.id)}
                type="button"
              >
                <span className="inspector-question-button__content" data-testid={`question-${question.id}`}>
                  <span className="inspector-question-button__section">{question.sectionId}</span>
                  <strong>{question.prompt}</strong>
                  <span className="inspector-question-button__meta">
                    {assignedHere ? "Assigned to you" : "Assigned to another Inspector — read-only"}
                  </span>
                </span>
              </button>
            );
          })}
        </section>
        <section className="inspector-response-panel" data-testid="checklist-response-panel">
          {selectedQuestion ? (
            <>
              <p className="eyebrow">{selectedQuestion.id}</p>
              <h2>{selectedQuestion.sectionId}</h2>
              <p>{selectedQuestion.prompt}</p>
              <div className="inspector-reference-box">
                <span>{selectedQuestion.regulatoryReference ?? "Configured checklist reference"}</span>
                <span>{selectedQuestion.expectedEvidence ?? "Inspector observation and required exception comment"}</span>
                <span>Comments required for Non Compliant and Observation</span>
              </div>
              <div className="inspector-state-row">
                <span>
                  <strong>Current owner</strong>
                  CAA Inspector
                </span>
                <span>
                  <strong>Next action</strong>
                  {projection.response ? "Confirm response and Finding path" : "Choose an answer"}
                </span>
                <span>
                  <strong>Finding path</strong>
                  {projection.potentialFinding ? "Potential Finding created" : "No Finding yet"}
                </span>
              </div>
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
                  aria-describedby="checklist-comment-rule"
                  disabled={!selectedQuestionAssignedHere || checklistReadOnly || attachmentRecoveryBlocked}
                  rows={5}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </label>
              <p className="inspector-comment-rule" id="checklist-comment-rule">
                {commentRequired
                  ? "Inspector comment is required for this answer before saving."
                  : "Optional for Compliant, Not Applicable, and Not Checked answers."}
              </p>
              <div className="button-row">
                <button
                  className="primary-button"
                  disabled={busy || !selectedQuestionAssignedHere || checklistReadOnly || attachmentRecoveryBlocked}
                  onClick={saveResponse}
                  type="button"
                >
                  Save response
                </button>
                {responseState ? (
                  <span data-testid="response-status">{responseState}</span>
                ) : null}
              </div>
              {responseState ? (
                <p className="inspector-acknowledgement" data-testid="local-server-state">
                  {responseState}
                </p>
              ) : null}
              {projection.fieldMode && projection.response && projection.potentialFinding && !checklistReadOnly ? (
                <section className="inspector-attachment-panel" aria-labelledby="inspection-attachment-title">
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
                  <span data-testid="selected-inspection-attachment">
                    {inspectionAttachment?.name ?? "No Inspection Attachment selected"}
                  </span>
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
              ) : projection.response && projection.potentialFinding ? (
                <section className="inspector-attachment-panel" aria-labelledby="inspection-attachment-title">
                  <h3 id="inspection-attachment-title">Inspection Attachment</h3>
                  <label>
                    Attachment file
                    <input
                      accept="application/pdf,image/jpeg,image/png"
                      disabled={busy || attachmentRecoveryBlocked}
                      onChange={(event) => setInspectionAttachment(event.target.files?.[0] ?? null)}
                      type="file"
                    />
                  </label>
                  <span data-testid="selected-inspection-attachment">
                    {inspectionAttachment?.name ?? "No Inspection Attachment selected"}
                  </span>
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
                <div className="inspector-finding-result">
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
        <section className="inspector-sync-panel" data-testid="field-sync-state" role="status">
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
        <section className="inspector-sync-panel" data-testid="field-sync-conflict" role="alert">
          <strong>Sync conflict — local draft preserved</strong>
          <span>
            {projection.fieldSyncConflict.code} at authoritative revision {projection.fieldSyncConflict.authoritativeRevision ?? "unknown"}.
            Re-enter the decision explicitly against the current server revision; no automatic merge was applied.
          </span>
        </section>
      ) : null}
      {projection.fieldSyncStatus === "resnapshot-required" ? (
        <section className="inspector-sync-panel" data-testid="field-resnapshot-required" role="alert">
          <strong>Safe package refresh required</strong>
          <span>Editing is blocked. Pending operations and Inspection Attachment bytes were preserved.</span>
        </section>
      ) : null}
      {projection.fieldMode && checklistReadOnly ? (
        <p className="inspector-sync-panel" data-testid="field-reopen-boundary">
          Reconnect to request a reasoned checklist reopen. Reopen is not an offline command.
        </p>
      ) : null}
      {projection.potentialFinding ? (
        <section className="inspector-workflow-footer">
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
            <RoleHandoff
              identityMode={identityMode}
              onRoleRequest={(role) => {
                session?.setActiveRole(role);
                navigate(createRoleEntryPath(role));
              }}
              session={session?.state ?? { status: "unauthenticated" }}
              targetRole="leadInspector"
            >
              Switch to Lead Inspector
            </RoleHandoff>
          )}
        </section>
      ) : null}
    </WorkspaceShell>
  );
}
