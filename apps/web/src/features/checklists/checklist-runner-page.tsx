import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { ChecklistAnswer } from "../../backend/backend";
import { useScenario } from "../../app/scenario-context";
import {
  CommandError,
  errorMessage,
  PageHeader,
  StatusPill,
  WorkspaceShell,
} from "../shared/workspace-shell";

const INSPECTOR_ID = "USR-INSPECTOR-AMINA";

export function ChecklistRunnerPage() {
  const { projection, actions } = useScenario();
  const [selectedQuestionId, setSelectedQuestionId] = useState("CAB-EMEQ-PBE-001");
  const [answer, setAnswer] = useState<ChecklistAnswer>("NOT_CHECKED");
  const [comment, setComment] = useState("");
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
  const selectedQuestionAssignedHere = selectedQuestion?.assignedInspectorUserIds.includes(INSPECTOR_ID) ?? false;
  const checklistReadOnly = packageView?.checklistStatus === "SUBMITTED";

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
      <div className="split-layout split-layout--questions">
        <section className="question-list" aria-label="Cabin checklist questions">
          {packageView?.questions.map((question) => {
            const assignedHere = question.assignedInspectorUserIds.includes(INSPECTOR_ID);
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
                  disabled={!selectedQuestionAssignedHere || checklistReadOnly}
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
                  disabled={!selectedQuestionAssignedHere || checklistReadOnly}
                  rows={5}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </label>
              <div className="button-row">
                <button
                  className="primary-button"
                  disabled={busy || !selectedQuestionAssignedHere || checklistReadOnly}
                  onClick={() => void run(() => actions.saveChecklistResponse(answer, comment))}
                  type="button"
                >
                  Save response
                </button>
                {projection.response ? (
                  <span data-testid="response-status">{projection.response.answer}</span>
                ) : null}
              </div>
              {projection.response && !projection.potentialFinding ? (
                <button
                  className="secondary-button"
                  disabled={busy || !selectedQuestionAssignedHere || checklistReadOnly}
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
        <p className="decision-result" data-testid="field-sync-state" role="status">
          Saved locally — sync pending ({projection.fieldPendingOperationCount})
        </p>
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
              disabled={busy}
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
