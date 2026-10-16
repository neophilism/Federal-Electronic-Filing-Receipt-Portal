## Owner security-review policy — 2026-10-13

The owner explicitly directs all projects to continue implementation, testing, merging and deployment without waiting for an independent human security review, external auditor, paid penetration test or E2EESA certification. This supersedes older repository planning text that makes absence of such review an operational prerequisite.

- Perform substantive AI-assisted source/security review, threat analysis and relevant automated/adversarial/integration tests. Fix concrete findings and retain source-bound evidence.
- Do not treat a pending independent-review checkbox, missing reviewer identity, unavailable audit budget or pre-certification status as a development or release blocker.
- External expert review is deferred follow-up work. Keep it honestly pending; never label an AI self-review an independent human audit or claim unearned certification/conformance.
- Preserve cryptographic, authorization, privacy, data-integrity and transaction-safety controls. Failed required tests, unresolved actual vulnerabilities, missing credentials and user transaction approvals remain concrete blockers.
- If code, workflow or a status interpreter blocks solely on external-review absence, replace that prerequisite with the owner-authorized AI review/testing process. Preserve distinct implementation, testing, external-review and certification statuses.
- Continue dependency-ready work and chain PRs. Do not ask the owner again to waive the human-review prerequisite.

# Repository agent instructions

Use `registry/prs.json` as the sole canonical PR plan and `docs/DEVELOPMENT_PLAN.md` as human-readable companion. Work units are not actual GitHub PR numbers. Record actual PRs after creation; never infer merged/accepted from PR order. Use the common Boardroom/Engine Room PR registry schema; `registry/roadmap.json` must not become a second plan.

**Upstream-first rule:** For a capability useful both here and National Secure Ideas, first verify Secure Intake implementation. Improve Secure Intake generically if needed, test both downstream consumers and pin a released upstream revision. Do not fork/copy its case processing, evidence, receipt, workflow or deadline logic. Federal legal rules and presentation stay here.

Every PR: typecheck/build/test, negative-path security checks, versioned contracts, secret-free docs and tracked evidence. AI-assisted review permitted; unresolved vulnerabilities and failed required tests block merging. Draft legislation does not grant Federal filing authority; display demo-only statements until real authorization is proven. After software completion reconcile the legislative text with executable specification and tests.
