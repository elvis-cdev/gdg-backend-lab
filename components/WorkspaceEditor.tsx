"use client";

import { useMemo, useState } from "react";

type Props = { teamId: string; initialFiles: Record<string, string> };
type Tab = "build" | "design" | "curl";

const starterDesign = `# Campus Event System — Team Design

## Problem and users
- Students discover campus events and register for a seat.
- Organizers create events, set capacity, and review registrations.
- Facilitators can inspect the team's design and API decisions.

## Resources / data model
- Event: id, title, description, startsAt, capacity, registeredCount, status.
- Student: id, name (use fictional workshop data).
- Registration: id, eventId, studentId, createdAt, status.

## Business rules (edit these as a team)
1. An event must exist before a student can register.
2. An event must be open for registration.
3. A student may register only once per event.
4. An event cannot exceed its capacity.
5. Validate all required input and return useful JSON errors.
6. Use HTTP status codes consistently.
7. Never trust a capacity or registration count sent by the client.

## API contract (agree before coding)
- GET /health — service health.
- GET /events — list events (team-defined).
- POST /events — create an event (bonus).
- GET /events/:eventId — view one event (bonus).
- POST /register — register a student.
- GET /events/:eventId/registrations — list registrations (bonus).

## Decisions and trade-offs
- Prototype storage: in-memory (resets when the process restarts).
- Production storage: database with a unique constraint on (eventId, studentId).
- Capacity: reserve seats atomically inside a transaction to avoid overbooking.
- Authentication/authorization: propose who may create events and view student data.

## Team notes
Write down assumptions, edge cases, and questions for the facilitator.
`;

const starterServer = `const http = require("node:http");

const server = http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");

  if (req.method === "GET" && req.url === "/health") {
    return res.end(JSON.stringify({ ok: true }));
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Campus API listening on http://localhost:3000");
});
`;

function shellQuote(value: string) {
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

export function WorkspaceEditor({ teamId, initialFiles }: Props) {
  const seedFiles = useMemo(() => ({
    ...initialFiles,
    "DESIGN.md": initialFiles["DESIGN.md"] ?? starterDesign,
    "server.js": initialFiles["server.js"] ?? starterServer,
  }), [initialFiles]);
  const [files, setFiles] = useState(seedFiles);
  const [selected, setSelected] = useState("server.js");
  const [tab, setTab] = useState<Tab>("build");
  const [message, setMessage] = useState("");
  const [output, setOutput] = useState("No run yet.");
  const [busy, setBusy] = useState(false);
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000");
  const [method, setMethod] = useState("POST");
  const [endpoint, setEndpoint] = useState("/register");
  const [body, setBody] = useState(JSON.stringify({ eventId: "event-001", userId: "student-007" }, null, 2));

  const curlCommand = useMemo(() => {
    const url = baseUrl.replace(/\/$/, "") + (endpoint.startsWith("/") ? endpoint : "/" + endpoint);
    const parts = ["curl", "-i", "-X", method, shellQuote(url), "-H", shellQuote("Content-Type: application/json")];
    if (method !== "GET" && method !== "HEAD") parts.push("--data", shellQuote(body));
    return parts.join(" ");
  }, [baseUrl, endpoint, method, body]);

  async function save() {
    setBusy(true); setMessage("");
    try {
      const r = await fetch(`/api/teams/${teamId}/workspace`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ files }) });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Save failed");
      setMessage("Workspace saved.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Save failed"); }
    finally { setBusy(false); }
  }

  async function run() {
    setBusy(true); setMessage(""); setOutput("Running in isolated sandbox…");
    try {
      const r = await fetch(`/api/teams/${teamId}/run`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Run failed");
      setOutput(JSON.stringify(d, null, 2));
    } catch (e) { setOutput(e instanceof Error ? e.message : "Run failed"); }
    finally { setBusy(false); }
  }

  async function submit() {
    setBusy(true); setMessage("");
    try {
      const r = await fetch(`/api/teams/${teamId}/submit`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Submit failed");
      setMessage("Team submission recorded: " + d.id);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Submit failed"); }
    finally { setBusy(false); }
  }

  function downloadFile(name: string, content: string) {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setMessage(label + " copied to clipboard."); }
    catch { setMessage("Clipboard unavailable. Select and copy the text manually."); }
  }

  return <div className="workspace">
    <div className="tabs" role="tablist" aria-label="Team workspace">
      <button className={tab === "build" ? "active" : ""} onClick={() => { setTab("build"); if (selected === "DESIGN.md") setSelected("server.js"); }}>Code workspace</button>
      <button className={tab === "design" ? "active" : ""} onClick={() => { setTab("design"); setSelected("DESIGN.md"); }}>System designer</button>
      <button className={tab === "curl" ? "active" : ""} onClick={() => setTab("curl")}>API &amp; curl</button>
    </div>

    {tab === "build" && <div className="grid">
      <section className="card">
        <div className="section-heading"><p className="eyebrow">IMPLEMENT</p><h2>Team code editor</h2><p className="muted">Write the Node.js HTTP API in server.js. Add notes or test scripts as other workspace files.</p></div>
        <div className="file-tabs">{Object.keys(files).filter(f => f !== "DESIGN.md").map(f => <button className={f === selected ? "active" : ""} key={f} onClick={() => setSelected(f)}>{f}</button>)}</div>
        <textarea className="editor" aria-label={selected + " editor"} spellCheck={false} value={files[selected] ?? ""} onChange={e => setFiles({ ...files, [selected]: e.target.value })} />
        <div className="row">
          <button onClick={save} disabled={busy}>Save shared workspace</button>
          <button onClick={run} disabled={busy}>Run backend</button>
          <button onClick={submit} disabled={busy}>Submit solution</button>
        </div>
        <p className="muted">Execution runs in an isolated container and returns logs. It does not keep an HTTP server publicly available for curl.</p>
        <p role="status">{message}</p>
      </section>
      <section className="card">
        <p className="eyebrow">CURRENT OUTPUT</p><h2>Execution output</h2><pre className="code">{output}</pre>
        <h3>Acceptance checklist</h3><ul><li>POST /register accepts JSON.</li><li>Missing or blank IDs return 400.</li><li>Unknown event returns 404.</li><li>Duplicate registration returns 409.</li><li>Success returns 201 and JSON.</li><li>Malformed JSON does not crash the server.</li></ul>
        <div className="row"><button className="secondary" onClick={() => downloadFile("server.js", files["server.js"] ?? starterServer)}>Download server.js</button><button className="secondary" onClick={() => downloadFile("DESIGN.md", files["DESIGN.md"] ?? starterDesign)}>Download design</button></div>
      </section>
    </div>}

    {tab === "design" && <section className="card">
      <p className="eyebrow">THINK BEFORE YOU CODE</p><h2>Design your campus event system</h2>
      <p className="muted">Agree on resources, fields, business rules, endpoints, permissions, and edge cases. Edit this living design document as your team makes decisions, then save it with the workspace.</p>
      <textarea className="editor design-editor" aria-label="Campus system design document" spellCheck={false} value={files["DESIGN.md"] ?? starterDesign} onChange={e => setFiles({ ...files, "DESIGN.md": e.target.value })} />
      <div className="row"><button onClick={save} disabled={busy}>Save design with workspace</button><button className="secondary" onClick={() => downloadFile("DESIGN.md", files["DESIGN.md"] ?? starterDesign)}>Download design document</button><button className="secondary" onClick={() => setTab("curl")}>Define and try API calls →</button></div>
      <p role="status">{message}</p>
    </section>}

    {tab === "curl" && <section className="card">
      <p className="eyebrow">API CLIENT</p><h2>Build a curl request</h2>
      <p className="muted">Define the endpoint your team is implementing, generate a command, and run it from a terminal against a server you have started and can reach.</p>
      <div className="grid">
        <label>API base URL<input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="http://localhost:3000" /></label>
        <label>HTTP method<select value={method} onChange={e => setMethod(e.target.value)}><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select></label>
        <label>Path<input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="/register" /></label>
        <label>JSON request body<textarea className="body-editor" value={body} onChange={e => setBody(e.target.value)} spellCheck={false} /></label>
      </div>
      <h3>Generated command</h3><pre className="code">{curlCommand}</pre>
      <div className="row"><button onClick={() => copy(curlCommand, "curl command")}>Copy curl command</button><button className="secondary" onClick={() => downloadFile("request.sh", "#!/usr/bin/env bash\nset -euo pipefail\n" + curlCommand + "\n")}>Download request.sh</button></div>
      <div className="notice"><strong>How to use it:</strong> download server.js, run <code>node server.js</code> in a terminal where Node.js is installed, then run the generated curl command in a second terminal. Use the base URL of a reachable server. The hosted sandbox currently runs code for a short time and does not expose a persistent student API URL.</div>
      <p role="status">{message}</p>
    </section>}
  </div>;
}
