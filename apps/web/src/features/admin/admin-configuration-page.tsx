import { useEffect, useState } from "react";

import { useBackendForRole } from "../../app/providers";
import type {
  ChecklistAnswer,
  ChecklistTemplateVersionDetailView,
  ChecklistTemplateVersionView,
} from "../../backend/backend";
import { CommandError, errorMessage, WorkspaceShell } from "../shared/workspace-shell";

type AdminPreviewMode = "register" | "preview";

const answerLabels: Record<ChecklistAnswer, string> = {
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-Compliant",
  OBSERVATION: "Observation",
  NOT_APPLICABLE: "Not Applicable",
  NOT_CHECKED: "Not Checked",
};

function answers(values: ChecklistAnswer[]): string {
  return values.map((value) => answerLabels[value]).join(" · ");
}

function templateDomain(templateId: string): string {
  return templateId === "CABIN" ? "Cabin Safety" : templateId;
}

function previewTitle(title: string): string {
  return title.replace(/\s+checklist$/i, "");
}

export function AdminConfigurationPage() {
  const backend = useBackendForRole("admin");
  const [templates, setTemplates] = useState<ChecklistTemplateVersionView[]>([]);
  const [detail, setDetail] = useState<ChecklistTemplateVersionDetailView | null>(null);
  const [mode, setMode] = useState<AdminPreviewMode>("preview");
  const [error, setError] = useState<string | null>(null);

  async function loadDetail(templateVersionId: string): Promise<void> {
    setError(null);
    try {
      const next = await backend.configuration.getChecklistTemplateVersion({ templateVersionId });
      if (!Array.isArray(next.questions)) throw new Error("Checklist template detail is malformed.");
      setDetail(next);
      setMode("preview");
    } catch (cause) {
      setDetail(null);
      setError(errorMessage(cause));
    }
  }

  useEffect(() => {
    let active = true;
    void backend.configuration.listChecklistTemplateVersions({ limit: 100 })
      .then(async (output) => {
        if (!active) return;
        setTemplates(output.items);
        if (!output.items.length) {
          setMode("register");
          return;
        }
        await loadDetail(output.items[0]!.id);
      })
      .catch((cause) => {
        if (active) {
          setMode("register");
          setError(errorMessage(cause));
        }
      });
    return () => { active = false; };
    // The role-scoped Backend is stable for the mounted route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WorkspaceShell roleLabel="Admin Preview" routeLabel="Templates">
      <div className="admin-template-workspace">
        {mode === "register" ? (
          <>
            <header className="admin-page-head workbench-page-header">
              <div><h1>Checklist Templates</h1><p>Published checklist versions available for read-only preview.</p></div>
            </header>
            <CommandError message={error} />
            {templates.length ? (
              <div className="admin-table-scroll">
                <table aria-label="Published checklist template versions" className="admin-template-register">
                  <thead><tr><th>Template</th><th>Domain</th><th>Version</th><th>Items</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>{templates.map((template) => (
                    <tr key={template.id}>
                      <td><b>{template.title}</b><small>{template.id}</small></td>
                      <td>{templateDomain(template.templateId)}</td>
                      <td>Version {template.version}</td>
                      <td>{template.questionCount}</td>
                      <td><span className="admin-published-badge"><i />Published</span></td>
                      <td><button aria-label={`Preview ${template.id}`} onClick={() => void loadDetail(template.id)} type="button">Preview</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <p className="admin-empty-state">No published checklist template versions are available.</p>}
          </>
        ) : (
          <>
            <header className="admin-page-head workbench-page-header">
              <div><h1>Template Preview — {detail ? previewTitle(detail.title) : "Published checklist"}</h1><p>Read-only preview of the published checklist template.</p></div>
              <button onClick={() => setMode("register")} type="button">Back to templates</button>
            </header>
            <CommandError message={error} />
            {detail ? (
              <>
                <section aria-label="Published template summary" className="admin-template-summary">
                  <div><span>Template ID</span><b>{detail.id}</b></div>
                  <div><span>Domain</span><b>{templateDomain(detail.templateId)}</b></div>
                  <div><span>Version</span><b data-testid="template-version">Version {detail.version}</b></div>
                  <div><span>Owner</span><b>{templateDomain(detail.templateId)} Section</b></div>
                  <div><span>Items</span><b>{detail.questionCount}</b></div>
                  <div><span>Status</span><b>Published</b><small>{detail.publishedAt.slice(0, 10)}</small></div>
                </section>
                <p className="admin-source-profile">Source workbook profile: 126 Cabin Inspection rows across 6 sections. This demo runs a curated {detail.questionCount}-question subset; the source workbook remains a mock/configured checklist reference, not a live import or legal source.</p>
                <div className="admin-table-scroll admin-question-table-scroll">
                  <table aria-label="Published checklist questions" className="admin-question-table">
                    <thead><tr><th>Row</th><th>Question</th><th>Regulatory reference</th><th>Expected evidence</th><th>Trace</th></tr></thead>
                    <tbody>{detail.questions.map((question, index) => (
                      <tr key={question.id}>
                        <td><span className="admin-row-number">{index + 1}</span></td>
                        <td><b>{question.prompt}</b><small>{question.id}</small><em className="admin-allowed-answers admin-allowed-answers--question">Allowed answers: {answers(question.allowedAnswers)}</em></td>
                        <td>{question.regulatoryReference ?? "No configured regulatory reference"}</td>
                        <td>{question.expectedEvidence ?? "No expected Evidence configured"}<small>Comment required for {answers(question.commentRequiredFor)}</small></td>
                        <td><span className="admin-published-badge"><i />published</span><em className="admin-allowed-answers admin-allowed-answers--trace">Allowed answers: {answers(question.allowedAnswers)}</em></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </WorkspaceShell>
  );
}
