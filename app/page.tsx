import Link from "next/link";
import { currentUser } from "@/lib/auth";

export default async function Home() {
  const user = await currentUser();

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">GDG ON CAMPUS · BACKEND ENGINEERING JOURNEY</p>
        <h1>Think like an engineer. Build systems you can trust.</h1>
        <p className="hero-copy">
          Go beyond writing endpoints. Collaborate with a team, build a backend,
          test what happens when things fail, and explain the decisions behind
          your design.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link className="button" href="/dashboard">Open your dashboard →</Link>
          ) : (
            <>
              <Link className="button" href="/register">Join the lab →</Link>
              <Link className="button secondary" href="/login">Sign in</Link>
            </>
          )}
        </div>
        <div className="row" style={{ marginTop: 30 }}>
          <span className="pill">Team-based learning</span>
          <span className="pill">Real backend challenges</span>
          <span className="pill">Facilitator feedback</span>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">YOUR WORKSHOP WORKSPACE</p>
          <h2>Learn by building, testing, and explaining</h2>
          <p className="muted">One shared environment for the team and its facilitator.</p>
        </div>
        <div className="grid">
          <article className="card">
            <div className="feature-icon">01</div>
            <h3>Collaborate as a team</h3>
            <p className="muted">
              Create a team or join with a code. Work together in a shared
              workspace and keep your challenge files in one place.
            </p>
          </article>
          <article className="card">
            <div className="feature-icon">02</div>
            <h3>Build reliable backends</h3>
            <p className="muted">
              Explore API design, input validation, duplicate prevention,
              failure handling, and the reasoning behind system decisions.
            </p>
          </article>
          <article className="card">
            <div className="feature-icon">03</div>
            <h3>Submit and review</h3>
            <p className="muted">
              Submit your team's work for facilitator review. Submitted
              snapshots help preserve what your team turned in.
            </p>
          </article>
          <article className="card">
            <div className="feature-icon">04</div>
            <h3>Explain your decisions</h3>
            <p className="muted">
              Discuss trade-offs, security risks, and what you would improve
              before a system is ready for real users.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <div className="page-heading" style={{ marginBottom: 0 }}>
            <div>
              <p className="eyebrow">READY TO START?</p>
              <h2>Bring your curiosity. Build something real.</h2>
              <p className="muted">
                Use a password of at least 12 characters when creating your account.
              </p>
            </div>
            <div className="hero-actions" style={{ marginTop: 0 }}>
              <Link className="button" href={user ? "/dashboard" : "/register"}>
                {user ? "Go to dashboard" : "Create your account"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <p className="muted" style={{ fontSize: 12 }}>
        Workshop MVP: code execution depends on the separate isolated runner
        being configured. Use fictional student data during the pilot.
      </p>
    </main>
  );
}
