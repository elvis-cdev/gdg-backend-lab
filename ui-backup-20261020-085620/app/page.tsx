import Link from "next/link";
import { currentUser } from "@/lib/auth";
export default async function Home(){
 const user=await currentUser();
 return <main className="shell"><div className="notice"><b>MVP status:</b> browser editor, shared team workspace, submission snapshots, and isolated runner integration. Code execution requires the separate sandbox runner to be started. Use fictional student data during the pilot.</div>
 <div className="card"><h2>Learn by building</h2><p className="muted">Join a team, edit a real Node.js backend in the browser, run it in an isolated container, and submit one team solution for facilitator review.</p>
 {user?<><p>Signed in as <b>{user.name}</b> · {user.role}</p><div className="row"><Link href="/dashboard">Open dashboard</Link><form action="/api/auth/logout" method="post"><button className="secondary">Sign out</button></form></div></>:<div className="row"><Link href="/register">Create student account</Link><Link href="/login">Student / facilitator login</Link></div>}
 </div><div className="grid"><div className="card"><h3>Student teams</h3><p>Shared workspace, challenge tasks, and one submission per team.</p></div><div className="card"><h3>Facilitator review</h3><p>Inspect submitted code snapshots and test output from a protected dashboard.</p></div></div><p className="muted">For event delivery, facilitator access is configured using server-side environment variables. Never publish facilitator credentials.</p></main>
}
