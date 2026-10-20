import Link from "next/link";

export default function Login() {
  return (
    <main className="auth-shell">
      <section className="card auth-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Sign in to your workspace</h1>
        <p className="muted">
          Continue working with your team and your backend challenge.
        </p>
        <form action="/api/auth/login" method="post">
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
          <button type="submit">Sign in →</button>
        </form>
        <div className="auth-footer">
          New to the lab? <Link href="/register">Create an account</Link>
        </div>
      </section>
    </main>
  );
}
