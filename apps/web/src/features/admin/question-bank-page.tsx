import { useState, type FormEvent } from "react";

import type { AdminQuestionView } from "../../backend/backend";
import { AdminError, AdminPage, useAdminLoad, useAdminWorkspace } from "./admin-workspace-shared";

export function QuestionBankPage() {
  const backend = useAdminWorkspace();
  const [search, setSearch] = useState("");
  const [prompt, setPrompt] = useState("");
  const [configuredReference, setConfiguredReference] = useState("");
  const [expectedEvidence, setExpectedEvidence] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<AdminQuestionView | null>(null);
  const { data, error, reload } = useAdminLoad(() => backend.listQuestions({ search }), [backend, search]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!prompt.trim()) { setFormError("Question text is required."); return; }
    if (prompt.trim().length > 500) { setFormError("Question text must be 500 characters or fewer."); return; }
    if (!configuredReference.trim()) { setFormError("Configured reference is required."); return; }
    if (!expectedEvidence.trim()) { setFormError("Expected Evidence is required."); return; }
    try {
      const normalizedPrompt = prompt.trim();
      const normalizedReference = configuredReference.trim();
      const normalizedEvidence = expectedEvidence.trim();
      const question = await backend.createQuestion({
        prompt: normalizedPrompt,
        configuredReference: normalizedReference,
        expectedEvidence: normalizedEvidence,
        expectedRevision: null,
        idempotencyKey: `ADMIN-QUESTION-${JSON.stringify([normalizedPrompt, normalizedReference, normalizedEvidence])}`,
      });
      setCreated(question);
      reload();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Question creation failed.");
    }
  }

  return (
    <AdminPage testId="admin-question-bank-page" routeLabel="Question Bank" title="Question Bank" description="Create deterministic demo questions with configured-reference and expected Evidence metadata.">
      <section className="admin-question-composer" aria-label="Create a Question Bank record">
        <form onSubmit={(event) => void submit(event)}>
          <label>Question text<textarea aria-label="Question text" maxLength={500} onChange={(event) => setPrompt(event.target.value)} rows={5} value={prompt} /></label>
          <p aria-live="polite">{prompt.length} characters / 500</p>
          <label>Configured reference<input aria-label="Configured reference" onChange={(event) => setConfiguredReference(event.target.value)} value={configuredReference} /></label>
          <label>Expected Evidence<input aria-label="Expected Evidence" onChange={(event) => setExpectedEvidence(event.target.value)} value={expectedEvidence} /></label>
          <p>Configured reference and expected Evidence are reference only demo metadata, not legal advice.</p>
          <button type="submit">Create question</button>
        </form>
        <AdminError message={formError} />
        {created ? <p className="admin-success" role="status">Created Draft question <b>{created.id}</b>.</p> : null}
      </section>
      <section className="admin-filter-bar" aria-label="Question Bank filters"><label>Search<input aria-label="Search Question Bank" onChange={(event) => setSearch(event.target.value)} value={search} /></label></section>
      <AdminError message={error} />
      <div className="admin-card-register" role="list" aria-label="Question Bank records">
        {data?.items.map((question) => <article className="admin-record-card" key={question.id} role="listitem"><header><div><b>{question.prompt}</b><small>{question.id}</small></div><span>Revision {question.revision}</span></header><p><strong>Configured reference:</strong> {question.configuredReference}</p><p><strong>Expected Evidence:</strong> {question.expectedEvidence}</p></article>)}
      </div>
    </AdminPage>
  );
}
