# Federal Electronic Filing & Receipt Portal

Unified electronic filing for federal claims, complaints, petitions, appeals, and court submissions, with automatic verifiable receipts, secure routing, and independently auditable processing.

> **Development project  not an official U.S. Government filing service.** This repository cannot accept legally effective federal filings without enacted authority, a designated receiving institution, and an authorized deployment.

## Architecture

This is the Federal-specific downstream application of the [Secure Intake & Case Workflow Engine](https://github.com/neophilism/Secure-Intake-Case-Workflow-Engine). Generic intake, evidence, receipts, routing, corrections, and participant access belong in that upstream engine whenever useful to more than one application, including [National Secure Ideas Submission](https://github.com/neophilism/National-Secure-Ideas-Submission).

Federal-specific statutory policy, agency directory configuration, public presentation, and authorized agency/judiciary connectors belong here.

**Development plan:** `docs/DEVELOPMENT_PLAN.md`.  
**Canonical PR registry:** `registry/prs.json`.

## Prototype health contract

`npm run check` validates the plan, syntax checks the dependency-free JavaScript skeleton, and runs the Node tests. `npm start` serves
`GET /api/health`, a version 1 JSON liveness response with
`authority: "prototype-only"` and `filingsAccepted: false`. Other paths do not
accept filings. `GET /api/ready` returns HTTP 503 with `upstream_unconfigured` because no authorized upstream intake contract exists yet. Neither endpoint grants filing authority. The prototype binds to loopback by default; set `PORTAL_BIND_HOST=0.0.0.0` only for an explicitly authorized deployment. No durable writes or protected routes are implemented in this skeleton.

Never represent a demonstration receipt as evidence of receipt by the United States Government.
