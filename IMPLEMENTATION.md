# Implementation guide

## What is included
- Next.js student registration and login.
- Facilitator role provisioned separately via seed script.
- Team creation and join codes.
- Shared browser text editor for `server.js` and `README.md`.
- Save, run, and submit actions.
- PostgreSQL schema for users, sessions, teams, memberships, workspaces, and immutable submissions.
- Separate runner API that launches a constrained disposable Docker container.

## Prerequisites
Node.js 20+, Docker Engine, and PostgreSQL 16 (or Docker Compose for local development).

## Step 1 — environment
Copy `.env.example` to `.env`. Generate secrets:
- `SESSION_SECRET`: `openssl rand -base64 32`
- `RUNNER_TOKEN`: `openssl rand -hex 32`
- Facilitator bcrypt hash: `node -e "require('bcryptjs').hash('YOUR-LONG-UNIQUE-PASSWORD',12).then(console.log)"`

Set `DATABASE_URL`, `FACILITATOR_EMAIL`, `FACILITATOR_PASSWORD_HASH`, `RUNNER_URL=http://127.0.0.1:8787`, and matching `RUNNER_TOKEN`. The `SESSION_SECRET` is reserved for future CSRF/signing improvements in this MVP.

## Step 2 — database
Start PostgreSQL with your own secure credentials. For local-only development you may use the `postgres` service in docker-compose, but change the example password before anything beyond local testing.
Run:
```sh
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

## Step 3 — runner
The runner needs Docker access and a writable job directory:
```sh
mkdir -p /var/lib/gdg-runner
chmod 700 /var/lib/gdg-runner
RUNNER_TOKEN='same-long-token-as-web-app' RUNNER_WORK_DIR=/var/lib/gdg-runner node runner/worker.js
```
Run the runner on a dedicated local VM/host; keep it bound to loopback or behind private networking. Do not expose it to the internet. The runner uses the Docker CLI and `node:22-alpine` image; pull the image before the event with `docker pull node:22-alpine`.

## Step 4 — web app
In another terminal:
```sh
npm run dev
```
Open `http://localhost:3000`, register a student, create a team, and copy the join code to teammates. Facilitator login uses the configured email and password. The facilitator can review submitted snapshots at `/facilitator`.

## Step 5 — smoke test
1. Register two student accounts.
2. Create a team from account A and join using account B.
3. Edit `server.js`, save, run, and confirm output.
4. Submit the team solution.
5. Sign in as facilitator and review the snapshot.
6. Try accessing another team's workspace URL as a non-member; expect 404.
7. Try malformed IDs and duplicate registrations in the student-written backend.

## Known MVP gaps to fix before a real event
- Workspace writes are last-write-wins; add optimistic locking with the workspace version to avoid overwriting simultaneous edits.
- Add CSRF protection and rate limiting to login, registration, join, save, run, and submit endpoints.
- Add automated tests, submission grading/test cases, password reset, email verification, and an explicit privacy/retention notice.
- Runner process/container lifecycle and host hardening must be tested on the exact target OS. A dedicated runner VM is strongly recommended.
- The facilitator UI currently shows the latest submission per team; improve it to browse submission history.
- This is a starter implementation. Run tests and a security review before public deployment.
