# Federal Electronic Filing & Receipt Portal

Unified electronic filing for federal claims, complaints, petitions, appeals, and court submissions, with automatic verifiable receipts, secure routing, and independently auditable processing.

> **Development project — not an official U.S. Government filing service.** This repository cannot accept legally effective federal filings without enacted authority, a designated receiving institution, and an authorized deployment.

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

## Federal policy and agency-domain registry

`GET /api/policy` exposes the versioned prototype-only policy. `GET /api/agencies` is a read-only endpoint backed by an explicitly configured SHA-256-pinned registry; it returns 503 without current configuration. Domain matches never grant filing authority, and readiness continues to report the missing upstream intake contract.

See [agency policy and configuration](docs/AGENCY_POLICY.md) for trusted pin/revision settings, primary sources, exact-host matching, expiry and startup behavior. The optional reviewed sample lists only `www.justice.gov` from its USAGov entry; it is not a complete Federal directory or an authorized intake route.


## Public website shell

Open `http://127.0.0.1:3000/` after `npm start`. The overview, `/agencies`, `/help`, `/privacy` and `/about` pages are server-rendered HTML with a local stylesheet. They work without JavaScript or an account. The directory uses only a configured current registry and otherwise displays a truthful unavailable state. There is no filing form, upload, tracking lookup or government receipt.

The presentation contract, security review, negative HTTP tests and verification limits are recorded in [UFR-015 evidence](docs/evidence/UFR-015.md). Public pages support GET/HEAD; API method contracts remain separate. No arbitrary filesystem resources or SPA fallback are served.
