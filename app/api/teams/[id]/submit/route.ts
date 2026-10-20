import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const { id: teamId } = await params;
  const member = await db.teamMember.findFirst({
    where: { teamId, userId: user.id },
  });

  if (!member) {
    return NextResponse.json(
      { error: "Team membership required" },
      { status: 403 },
    );
  }

  const workspace = await db.workspace.findUnique({ where: { teamId } });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const submission = await db.submission.create({
    data: {
      teamId,
      submittedBy: user.id,
      codeSnapshot: workspace.files ?? {},
      status: "QUEUED",
    },
  });

  return NextResponse.json(
    { id: submission.id, status: submission.status },
    { status: 201 },
  );
}
