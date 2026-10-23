# Session 1 challenge: trustworthy event registration API

## Learning goal
Convert a problem into an API contract, implement a route, probe failure cases, and explain data integrity and concurrency.

## Scenario
A campus event registration service accepts a student registration. A student can register once per event. Use fictional identifiers and in-memory storage for the workshop prototype.

## Endpoint contract
POST /register, content type application/json.

Request:
```json
{ "eventId": "event-001", "userId": "student-007" }
```

Expected outcomes:
- Missing/blank eventId or userId: HTTP 400 and {"error":"eventId and userId are required"}.
- Event ID not in the team's known event list: HTTP 404 and {"error":"Event not found"}.
- Existing registration for the same eventId + userId: HTTP 409 and {"error":"Already registered"}.
- First valid registration: HTTP 201 and {"ok":true,"registration":{"eventId":"event-001","userId":"student-007"}}.
- Invalid JSON: HTTP 400 with a JSON error response, not a crashed process.
- Unsupported route/method: HTTP 404 or 405 with a JSON error response.

The event fixture should include event-001. Teams may add a second known event to demonstrate isolation between events. The starter workspace is an executable Node HTTP server; it is not a production database application.

## Student workflow
1. Identify resources, request fields, invariants, and failure modes.
2. Write request/response examples before implementation.
3. Implement the endpoint.
4. Test success, missing IDs, unknown event, duplicate registration, malformed JSON, and a different student/event.
5. Explain limitations of in-memory storage.
6. Propose database uniqueness and an atomic capacity reservation for production.

## Facilitator acceptance checklist
- [ ] Valid first registration returns 201.
- [ ] Missing or blank IDs return 400.
- [ ] Unknown event returns 404.
- [ ] Duplicate pair returns 409.
- [ ] A different student can register for the event.
- [ ] Same student can register for a different known event.
- [ ] Malformed JSON does not crash the server.
- [ ] Responses are JSON and statuses match the contract.
- [ ] Team can explain database unique constraints and concurrency.

## Assessment rubric (10 points)
- API contract and status codes: 0–2
- Input validation and malformed requests: 0–2
- Duplicate prevention and correct resource scoping: 0–2
- Failure handling and readable implementation: 0–2
- Engineering explanation, database integrity, and concurrency: 0–2

## Safety and scope
The runner is a teaching sandbox, not a hostile-code-proof production service. Keep it private, use fictional data, do not add secrets to workspace files, and test the runner on the actual event host. Acceptance cases in this document are a facilitator checklist, not an automated grading claim.
