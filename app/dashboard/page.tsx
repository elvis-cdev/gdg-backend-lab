import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const memberships = await db.teamMember.findMany({
    where: { userId: user.id },
    include: {
      team: {
        include: {
          members: { include: { user: true } },
          workspace: true,
        },
      },
    },
  });

  return (
    <main className="shell">
      <div className="page-heading">
        <div>
          <p className="eyebrow">STUDENT WORKSPACE</p>
          <h2>Welcome back, {user.name}</h2>
          <p className="muted">
            Organize your team, open your workspace, and keep moving through the challenge.
          </p>
        </div>
        <span className="pill">{user.role}</span>
      </div>

      <div className="grid">
        <section className="card">
          <div className="feature-icon">＋</div>
          <h3>Create a team</h3>
          <p className="muted">Start a workspace and invite teammates with the join code.</p>
          <form action="/api/teams" method="post">
            <label htmlFor="team-name">Team name</label>
            <input id="team-name" name="name" placeholder="e.g. API Architects" maxLength={60} required />
            <button type="submit">Create team →</button>
          </form>
        </section>

        <section className="card">
          <div className="feature-icon">↗</div>
          <h3>Join an existing team</h3>
          <p className="muted">Have a join code from a teammate? Enter it below.</p>
          <form action="/api/teams/join" method="post">
            <label htmlFor="join-code">Team join code</label>
            <input id="join-code" name="joinCode" placeholder="Enter your code" maxLength={20} required />
            <button type="submit">Join team →</button>
          </form>
        </section>
      </div>

      {user.role === "FACILITATOR" && (
        <section className="card">
          <p className="eyebrow">FACILITATOR ACCESS</p>
          <h3>Review team submissions</h3>
          <p className="muted">Open the protected facilitator dashboard to review submitted snapshots.</p>
          <Link className="button" href="/facilitator">Open facilitator dashboard →</Link>
        </section>
      )}

      <section className="section">
        <div className="page-heading">
          <div>
            <p className="eyebrow">COLLABORATION</p>
            <h2>Your teams</h2>
            <p className="muted">Your shared workspaces appear here.</p>
          </div>
          <span className="pill">{memberships.length} team{memberships.length === 1 ? "" : "s"}</span>
        </div>

        {memberships.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <div className="feature-icon" style={{ margin: "0 auto 18px" }}>⌘</div>
            <h3>Your first team starts here</h3>
            <p className="muted">
              Create a team or join one using a code. Your shared workspace will appear here.
            </p>
          </div>
        ) : (
          <div className="grid">
            {memberships.map(({ team }) => (
              <article className="card team-card" key={team.id}>
                <div className="row">
                  <span className="feature-icon" style={{ marginBottom: 0 }}>⌘</span>
                  <span className="pill">{team.members.length} member{team.members.length === 1 ? "" : "s"}</span>
                </div>
                <h3>{team.name}</h3>
                <p className="muted">
                  {team.members.map((member) => member.user.name).join(", ")}
                </p>
                <div>
                  <p className="muted" style={{ fontSize: 12 }}>TEAM JOIN CODE</p>
                  <span className="pill">{team.joinCode}</span>
                </div>
                <Link className="team-link" href={`/team/${team.id}`}>
                  Open shared workspace →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
