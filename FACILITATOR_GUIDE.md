# Facilitator guide — Backend Engineering Journey, Session 1

Theme: Think Like a Backend Engineer: From Problem to Trustworthy System

## Suggested 75-minute flow
- 0–5 min: Explain the scenario and outcomes.
- 5–12 min: Teams identify resources, invariants, request fields, and failure modes.
- 12–22 min: Each team writes its API contract before coding.
- 22–45 min: Implement and test in the shared workspace.
- 45–58 min: Failure injection: missing IDs, unknown event, duplicate request, malformed JSON.
- 58–70 min: Team demos and defends trade-offs.
- 70–75 min: Debrief and one takeaway per team.

## Ask teams
- What should happen if a request is repeated?
- Is checking a duplicate in application memory enough if two requests arrive at once?
- What if the server restarts?
- What happens if two students try to take the last seat?
- Which response helps a client recover, and which response signals a conflict?

## Scoring rubric (10 points)
1. Contract and status codes (0–2).
2. Validation and malformed input (0–2).
3. Duplicate prevention and correct event/user scoping (0–2).
4. Failure handling and readability (0–2).
5. Explanation of persistent storage, unique constraints, and concurrency (0–2).

## Review procedure
Open /facilitator, inspect the latest submitted snapshot, and use the rubric to score the demonstration. The current application records submissions but does not yet store rubric scores or automatically run these acceptance tests.

## Operational notes
- Verify login, team creation/join, workspace save, runner execution, and submission on the actual deployment before the event.
- The code runner must be configured separately from the Vercel web app. A local runner is unavailable while the host machine is off or disconnected.
- Use fictional event/student identifiers. Do not put real participant data, passwords, API keys, or secrets in workspace code.
- Keep the runner private; do not expose Docker control or an unauthenticated runner endpoint to the public internet.
