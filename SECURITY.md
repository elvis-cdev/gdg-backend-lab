# Security architecture and MVP limits

## Trust boundaries
- Browser is untrusted; all authorization and validation is server-side.
- Web app stores hashed passwords and random opaque session tokens (only token hashes in DB).
- Student code is sent to a separate runner API authenticated with HMAC, timestamped to limit replay.
- Runner launches one disposable container per execution with no network, read-only root filesystem, dropped Linux capabilities, no-new-privileges, memory/CPU/PID limits, and a 5-second timeout.
- Facilitator accounts are provisioned only through environment-configured seeding, never public registration.
- Team access is enforced on workspace, run, and submit endpoints.
- Submissions store immutable code snapshots for review.

## Before any public deployment
This is a teaching MVP, not a security-audited service. The runner uses Docker and the host Docker socket. A Docker socket is effectively host-root access; do not colocate this runner with the public web app. Prefer a dedicated VM/host or a hardened sandbox such as gVisor, Kata Containers, or a managed isolated execution service. Add network ingress restrictions, TLS, CSRF protection for cookie-authenticated mutations, rate limiting, audit logs, quotas, monitoring, retention policy, database backups, dependency scanning, and independent security review. Configure reverse proxy limits. Add proper per-team concurrency/locking for workspace writes and capacity limits. Do not expose runner port publicly.
