export type EmptyErrorStateKind = "empty" | "error" | "loading";

const kindLabel: Record<EmptyErrorStateKind, string> = {
  empty: "Empty state",
  error: "Error state",
  loading: "Loading state",
};

export function EmptyErrorState({
  kind,
  pageTitle,
  title,
  message,
}: {
  kind: EmptyErrorStateKind;
  pageTitle: string;
  title: string;
  message?: string;
}) {
  return (
    <section
      aria-label={`${pageTitle} ${kindLabel[kind]}`}
      className={`workbench-empty-error-state workbench-empty-error-state--${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <p className="eyebrow">{kindLabel[kind]}</p>
      <h2>{pageTitle}: {title}</h2>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
