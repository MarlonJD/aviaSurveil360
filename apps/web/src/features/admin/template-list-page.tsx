import { Link } from "react-router-dom";

import { AdminError, AdminPage, DisabledAdminAction, useAdminLoad, useAdminWorkspace } from "./admin-workspace-shared";

export function TemplateListPage() {
  const backend = useAdminWorkspace();
  const { data, error } = useAdminLoad(() => backend.listTemplateMasters({}), [backend]);
  return (
    <AdminPage testId="admin-template-list-page" routeLabel="Template List" title="Checklist Templates" description="Exact template masters and immutable published versions available to Admin Preview.">
      <AdminError message={error} />
      <div className="admin-card-register" role="list" aria-label="Checklist template masters">
        {data?.items.map((template) => (
          <article className="admin-record-card" key={template.id} role="listitem">
            <header><div><b>{template.title}</b><small>{template.id}</small></div><span>{template.status}</span></header>
            <dl><div><dt>Published version</dt><dd>{template.publishedVersionId}</dd></div><div><dt>Owner</dt><dd>{template.owner}</dd></div><div><dt>Items</dt><dd>{template.itemCount}</dd></div></dl>
            {template.previewPath ? <Link className="admin-action-link" aria-label={`Preview ${template.publishedVersionId}`} to={template.previewPath}>Preview {template.publishedVersionId}</Link> : <DisabledAdminAction label={`Open ${template.id}`} reason={template.disabledReason ?? `${template.id} has no declared Template Preview route.`} />}
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
