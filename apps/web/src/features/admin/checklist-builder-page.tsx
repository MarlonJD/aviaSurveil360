import { useState } from "react";

import type { AdminTemplateVersionView } from "../../backend/backend";
import { AdminError, AdminPage, DisabledAdminAction, useAdminLoad, useAdminWorkspace } from "./admin-workspace-shared";

export function ChecklistBuilderPage() {
  const backend = useAdminWorkspace();
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [commandError, setCommandError] = useState<string | null>(null);
  const templateLoad = useAdminLoad(() => backend.getTemplate({ templateId: "TPL-CABIN-2026" }), [backend]);
  const questionLoad = useAdminLoad(() => backend.listQuestions({}), [backend]);
  const template = templateLoad.data;
  const draft = template?.versions.find((version) => version.status === "DRAFT") ?? null;
  const published = template?.versions.find((version) => version.id === "CTV-CABIN-1") ?? null;
  const questions = new Map(questionLoad.data?.items.map((question) => [question.id, question]) ?? []);
  const available = questionLoad.data?.items.filter((question) => !draft?.questionIds.includes(question.id)) ?? [];

  async function run(command: () => Promise<AdminTemplateVersionView>) {
    setCommandError(null);
    try { await command(); templateLoad.reload(); questionLoad.reload(); } catch (cause) { setCommandError(cause instanceof Error ? cause.message : "Draft update failed."); }
  }

  async function addQuestion(version: AdminTemplateVersionView, questionId: string) {
    setCommandError(null);
    try {
      await backend.addDraftQuestion({ templateId: version.templateId, draftVersionId: version.id, questionId, expectedRevision: version.revision, idempotencyKey: `ADMIN-${version.id}-ADD-${questionId}` });
      setSelectedQuestionId("");
      templateLoad.reload();
      questionLoad.reload();
    } catch (cause) {
      setCommandError(cause instanceof Error ? cause.message : "Draft update failed.");
    }
  }

  return (
    <AdminPage testId="admin-checklist-builder-page" routeLabel="Checklist Builder" title="Checklist Builder" description="Configure one exact working Draft without changing the immutable published version.">
      <AdminError message={templateLoad.error ?? questionLoad.error ?? commandError} />
      <section className="admin-template-identity" aria-label="Template identity">
        <div><span>Template master</span><b>TPL-CABIN-2026</b></div><div><span>Immutable published version</span><b>CTV-CABIN-1</b></div><div><span>Published owner</span><b>Department Manager</b></div>
      </section>
      {!draft && template ? <button onClick={() => void run(() => backend.createDraft({ templateId: template.id, expectedRevision: template.revision, idempotencyKey: "ADMIN-TPL-CABIN-2026-DRAFT-2", changeReason: "Create a browser-local working checklist Draft." }))} type="button">Create working Draft</button> : null}
      {published ? <section className="admin-record-card"><h2>Published / locked</h2><p>{published.id} · {published.questionIds.length} exact questions · Revision {published.revision}</p><DisabledAdminAction label={`Edit ${published.id}`} reason={`${published.id} is PUBLISHED and its question array is immutable.`} /></section> : null}
      {draft ? (
        <section className="admin-builder-draft" aria-label={`Working Draft ${draft.id}`}>
          <header><div><h2>Working Draft</h2><p>{draft.id} · Revision {draft.revision} · Owner {draft.owner}</p></div><DisabledAdminAction label={`Publish ${draft.id}`} reason={`${draft.id} is DRAFT and Department Manager owns publishing after approval; Admin Preview cannot publish or submit it.`} /></header>
          <div className="admin-builder-add"><label>Question to add<select aria-label="Question to add" onChange={(event) => setSelectedQuestionId(event.target.value)} value={selectedQuestionId}><option value="">Select an exact question</option>{available.map((question) => <option key={question.id} value={question.id}>{question.id} — {question.prompt}</option>)}</select></label><button disabled={!selectedQuestionId || !available.some((question) => question.id === selectedQuestionId)} aria-label={!selectedQuestionId || !available.some((question) => question.id === selectedQuestionId) ? `Add question to ${draft.id} unavailable: select an exact Question Bank record.` : `Add ${selectedQuestionId} to ${draft.id}`} title={!selectedQuestionId || !available.some((question) => question.id === selectedQuestionId) ? `Select an exact Question Bank record for ${draft.id}.` : undefined} onClick={() => selectedQuestionId && void addQuestion(draft, selectedQuestionId)} type="button">Add question</button></div>
          <ol className="admin-builder-list">
            {draft.questionIds.map((questionId, index) => {
              const question = questions.get(questionId);
              const upReason = `${questionId} is already first in ${draft.id}.`;
              const downReason = `${questionId} is already last in ${draft.id}.`;
              return <li key={questionId}><div><span className="admin-order">{index + 1}</span><p><b>{question?.prompt ?? "Question unavailable"}</b><small>{questionId}</small><span>{question?.configuredReference}</span></p></div><div className="admin-builder-row-actions"><button aria-label={index === 0 ? `Move ${questionId} up unavailable: ${upReason}` : `Move ${questionId} up in ${draft.id}`} disabled={index === 0} title={index === 0 ? upReason : undefined} onClick={() => void run(() => backend.moveDraftQuestion({ templateId: draft.templateId, draftVersionId: draft.id, questionId, direction: "UP", expectedRevision: draft.revision, idempotencyKey: `ADMIN-${draft.id}-MOVE-${questionId}-UP-R${draft.revision}` }))} type="button">↑ <span>Up</span></button><button aria-label={index === draft.questionIds.length - 1 ? `Move ${questionId} down unavailable: ${downReason}` : `Move ${questionId} down in ${draft.id}`} disabled={index === draft.questionIds.length - 1} title={index === draft.questionIds.length - 1 ? downReason : undefined} onClick={() => void run(() => backend.moveDraftQuestion({ templateId: draft.templateId, draftVersionId: draft.id, questionId, direction: "DOWN", expectedRevision: draft.revision, idempotencyKey: `ADMIN-${draft.id}-MOVE-${questionId}-DOWN-R${draft.revision}` }))} type="button">↓ <span>Down</span></button></div></li>;
            })}
          </ol>
        </section>
      ) : null}
    </AdminPage>
  );
}
