# Repository agent instructions

Use `registry/prs.json` as the sole canonical PR plan and `docs/DEVELOPMENT_PLAN.md` as human-readable companion. Work units are not actual GitHub PR numbers. Record actual PRs after creation; never infer merged/accepted from PR order. Use the common Boardroom/Engine Room PR registry schema; `registry/roadmap.json` must not become a second plan.

**Upstream-first rule:** For a capability useful both here and National Secure Ideas, first verify Secure Intake implementation. Improve Secure Intake generically if needed, test both downstream consumers and pin a released upstream revision. Do not fork/copy its case processing, evidence, receipt, workflow or deadline logic. Federal legal rules and presentation stay here.

Every PR: typecheck/build/test, negative-path security checks, versioned contracts, secret-free docs and tracked evidence. AI-assisted review permitted; unresolved vulnerabilities and failed required tests block merging. Draft legislation does not grant Federal filing authority; display demo-only statements until real authorization is proven. After software completion reconcile the legislative text with executable specification and tests.
