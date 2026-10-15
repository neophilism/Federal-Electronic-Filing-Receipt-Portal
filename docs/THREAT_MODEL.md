# Authority and threat model

## Status and scope

This document defines the security and authority boundary for the development prototype. The portal is not an official United States Government recipient, does not create legal filing authority, and must not describe a demonstration receipt as proof that a government institution received a filing. Production authority requires enacted or otherwise valid legal authority, a designated receiving institution, an approved deployment, and institution-controlled acceptance evidence.

UFR-002 defines constraints for later implementation. It does not deploy an intake service or certify any agency, court, identity provider, key service, or external connector.

## Ownership and authority

| Capability | Implementation owner | Authority owner | Required boundary |
| --- | --- | --- | --- |
| Generic intake, evidence, receipt, correction, participant status, routing, deadline, and append-only workflow primitives | Secure Intake & Case Workflow Engine | Deploying institution | Versioned upstream API or event contract; no direct database access |
| Federal policy, agency directory, statutory presentation, and authorized judiciary adapters | Federal portal | Relevant Federal institution | Policy must be versioned, provenance-bound, and explicitly authorized |
| Reusable compliance rules, findings, and audit evidence | Compliance Authorization & Immutable Audit Engine | Independent compliance authority | Evidence is append-only and does not grant filing authority |
| Public verification of a receipt commitment | Shared engine candidate, subject to upstream-first review | Independent verifier | Verification proves only the stated cryptographic facts, not legal sufficiency or government receipt |
| Review, routing, adjudication, and legal sufficiency decisions | Authorized institution systems and staff | Relevant institution | Separate from durable submission receipt; cannot rewrite the original record |

Any capability useful to both this portal and National Secure Ideas Submission must be assessed in Secure Intake first. The portal may consume only a released, pinned, versioned upstream contract. It must not fork generic case-processing behavior.

## Protected assets

- Original submission bytes and their immutable content commitments.
- Receipt identifiers, timestamps, signatures, and verification material.
- Claimant identity, contact details, status, and correspondence.
- Agency and court routing policy, authority provenance, and connector configuration.
- Append-only audit evidence, correction history, and deadline state.
- Signing, encryption, session, deployment, and service credentials.
- Availability of submission, receipt retrieval, correction, and fallback paths.

Public receipt verification must not expose filing content, claimant identity, tracking secrets, routing details, or protected metadata.

## Trust boundaries

1. The public browser and network are untrusted.
2. Authentication proves only the configured identity claim; it does not prove legal authority, filing eligibility, or document truth.
3. The portal, Secure Intake, Compliance Engine, institution systems, identity providers, time sources, key services, scanners, storage, and notification providers are separate trust domains.
4. Staff authorization is tenant-, institution-, role-, purpose-, and action-scoped. A reviewer cannot mutate or backdate an original submission or receipt.
5. A tracking number alone grants no access.
6. Connector success is not receipt. A transmission becomes accepted only when the authorized recipient returns durable, authentic, contract-valid evidence.
7. Classified information must not enter the unclassified portal. The interface and APIs must fail closed and direct users to an authorized channel without collecting the content.

## Threat actors

- Unauthenticated attackers probing enumeration, injection, upload, and denial-of-service paths.
- Authenticated claimants attempting cross-account access, duplicate effects, or forged status.
- Compromised staff accounts attempting unauthorized lookup, rerouting, deletion, backdating, or audit suppression.
- Malicious or compromised upstream and downstream services returning stale, replayed, malformed, or contradictory evidence.
- Insiders with database, storage, deployment, or key access attempting undetected modification or disclosure.
- Supply-chain attackers modifying dependencies, build inputs, policy packages, or release evidence.
- Observers correlating public verification, timing, identifiers, or error behavior to infer protected activity.

## Required abuse and failure behavior

| Threat or failure | Required behavior |
| --- | --- |
| Identifier enumeration or cross-claimant lookup | Use unguessable handles plus authenticated, server-side authorization; return non-distinguishing denials and audit the attempt |
| Duplicate, replayed, or concurrent submission | Require caller-bound idempotency, atomic durable state transitions, and replay-safe receipts |
| Staff deletion, backdating, or receipt replacement | Deny mutation of originals; preserve append-only corrections and independently verifiable audit evidence |
| Forged or stale agency directory or policy | Require version, provenance, effective interval, signature or approved digest, and fail closed when verification is absent |
| Scanner, storage, queue, or routing outage | Preserve the durable original and receipt state separately; expose a truthful pending or quarantined state and bounded recovery |
| Downstream timeout or ambiguous response | Do not report accepted or transmitted; reconcile using an idempotent status contract before retry |
| Identity or authorization dependency outage | Deny protected operations; do not fall back to anonymous, cached, or broader access |
| Time or signing service failure | Do not fabricate a trusted timestamp or signature; preserve a recoverable pending state |
| Notification failure | Keep authoritative status in the portal; notifications are advisory and retryable |
| Audit sink failure | Fail closed for legally consequential mutations unless the durable transaction includes auditable evidence |
| Classified-content indication | Stop collection, avoid persisting the content, provide an approved-channel notice, and audit only the minimum safe event |
| Public verifier probing | Apply bounded requests and privacy-preserving responses; never disclose whether a claimant or filing exists |

## Security invariants

- Durable receipt creation is atomic with preservation of the immutable original-submission commitment.
- Receipt, routing, review, adjudication, and legal sufficiency are distinct states.
- Authorization is checked at the service boundary and again inside every durable mutation.
- Evidence is append-only; corrections reference prior state rather than replacing it.
- Sensitive data is encrypted in transit and at rest using reviewed, managed key boundaries. Secrets never enter source control, logs, receipts, URLs, analytics, or public verification responses.
- All externally supplied identifiers, files, policy documents, signatures, timestamps, and status responses are bounded and schema-validated before use.
- Dependency failure, timeout, cancellation, and retry paths must have negative tests.
- Logs and metrics use opaque correlation identifiers and data minimization. Retention and access are policy-controlled and auditable.
- Releases pin dependencies and contracts, produce reproducible validation evidence, and retain a rollback path without rolling back immutable evidence.

## Required verification evidence

Later units must add tests at the boundary they implement. At minimum, applicable suites cover unauthorized and cross-tenant access, identifier enumeration, malformed and oversized input, replay and concurrent requests, stale policy, signature and timestamp failure, dependency timeout, ambiguous downstream completion, audit failure, cancellation, recovery, and privacy-preserving public responses.

Portable tests do not establish government authorization, production availability, hardware-backed key protection, external provider correctness, legal sufficiency, accessibility acceptance, or independent security review. Those claims require repository-linked evidence from the responsible authority.

## Review triggers

Re-review this model before merging a change that adds a new data category, trust domain, institution connector, identity or key provider, public verification field, staff power, legal-status transition, cross-repository contract, or deployment environment. Record accepted changes in the canonical PR registry and update executable negative-path tests.
