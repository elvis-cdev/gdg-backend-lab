import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Facilitator() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "FACILITATOR") redirect("/dashboard");

  const teams = await db.team.findMany({
    include: {
      members: { include: { user: true } },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const submittedTeams = teams.filter((team) => team.submissions.length > 0).length;

  return (
    <main className="shell">
      <div className="page-heading">
        <div>
          <p className="eyebrow">FACILITATOR CONSOLE</p>
          <h2>Workshop overview</h2>
          <p className="muted">
            Track teams, see the latest submission, and inspect submitted code snapshots.
          </p>
        </div>
        <span className="pill">Restricted access</span>
      </div>

      <div className="grid">
        <div className="card stat-card">
          <span className="stat-label">Total teams</span>
          <div className="stat-value">{teams.length}</div>
          <span className="muted">Created workspaces</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Teams with submissions</span>
          <div className="stat-value">{submittedTeams}</div>
          <span className="muted">Teams with at least one submission</span>
        </div>
      </div>

      <section className="section">
        <div className="section-heading">
          <h2>Team submissions</h2>
          <p className="muted">Latest submission for each team.</p>
        </div>

        {teams.length === 0 ? (
          <div className="card">
            <h3>No teams yet</h3>
            <p className="muted">Team workspaces will appear here when students create them.</p>
          </div>
        ) : (
          teams.map((team) => {
            const latest = team.submissions[0];

            return (
              <article className="card" key={team.id}>
                <div className="page-heading" style={{ marginBottom: 16 }}>
                  <div>
                    <h3>{team.name}</h3>
                    <p className="muted">
                      Members: {team.members.map((member) => member.user.name).join(", ") || "None"}
                    </p>
                  </div>
                  <span className="pill">{team.members.length} member{team.members.length === 1 ? "" : "s"}</span>
                </div>

                <div style={{ padding: 16, borderRadius: 12, background: "var(--surface-soft)" }}>
                  {latest ? (
                    <>
                      <p><strong>Latest submission</strong></p>
                      <p className="muted">
                        Submitted by {latest.user.name} · {latest.createdAt.toLocaleString()}
                      </p>
                      <span className="pill">{latest.status}</span>
                      <div style={{ marginTop: 16 }}>
                        <Link className="button" href={`/facilitator/submissions/${latest.id}`}>
                          Review submitted code →
                        </Link>
                      </div>
                    </>
                  ) : (
                    <p className="muted" style={{ margin: 0 }}>No submission yet.</p>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
