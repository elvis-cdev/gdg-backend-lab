import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { WorkspaceEditor } from "@/components/WorkspaceEditor";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();

  if (!user) redirect("/login");

  const { id } = await params;

  const membership = await db.teamMember.findFirst({
    where: { teamId: id, userId: user.id },
    include: {
      team: {
        include: {
          members: { include: { user: true } },
          workspace: true,
        },
      },
    },
  });

  if (!membership) notFound();

  const files = (membership.team.workspace?.files as Record<string, string>) ?? {
    "server.js": `const http = require("node:http");

const server = http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");

  if (req.method === "GET" && req.url === "/health") {
    return res.end(JSON.stringify({ ok: true }));
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(3000, "0.0.0.0");
`,
    "README.md": `# Our backend

Team: ${membership.team.name}

## Challenge
Implement POST /register with validation and duplicate prevention.
`,
  };

  return (
    <main className="shell">
      <div className="row">
        <h2>{membership.team.name}</h2>
        <span className="pill">Shared team workspace</span>
      </div>
      <p className="muted">
        Members: {membership.team.members.map((m) => m.user.name).join(", ")}
      </p>
      <WorkspaceEditor teamId={id} initialFiles={files} />
    </main>
  );
}
