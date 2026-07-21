import { BRAND_ASSETS } from "../ui/brand-assets";

export function LoginPage({
  message,
  onLogin,
}: {
  message?: string;
  onLogin(): void;
}) {
  return (
    <main className="role-select-page" data-testid="login-page">
      <section className="role-select-panel">
        <img
          alt="AviaSurveil360"
          className="role-select-logo"
          src={BRAND_ASSETS.mark}
        />
        <p className="eyebrow">Civil Aviation Authority</p>
        <h1>Sign in to AviaSurveil360</h1>
        <p className="workspace-purpose">
          Use your organization identity to access assigned oversight work.
        </p>
        {message ? <p className="command-error" role="alert">{message}</p> : null}
        <button className="primary-button" onClick={onLogin} type="button">
          Sign in with organization identity
        </button>
      </section>
    </main>
  );
}
