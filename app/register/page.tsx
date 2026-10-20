import Link from "next/link";

export default function Register() {
  return (
    <main className="auth-shell">
      <section className="card auth-card">
        <p className="eyebrow">GET STARTED</p>
        <h1>Create your student account</h1>
        <p className="muted">
          Join a team, build backend systems, and submit your work for review.
        </p>
        <form action="/api/auth/register" method="post">
          <label htmlFor="name">Your name</label>
          <input id="name" name="name" autoComplete="name" minLength={2} maxLength={80} placeholder="How teammates know you" required />
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required />
          <label htmlFor="password">Create a password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} placeholder="At least 12 characters" required />
          <p className="muted" style={{ fontSize: 12 }}>
            Use at least 12 characters. Facilitator accounts must be configured separately.
            Do not use sensitive student IDs for this workshop MVP.
          </p>
          <button type="submit">Create account →</button>
        </form>
        <div className="auth-footer">
          Already registered? <Link href="/login">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
