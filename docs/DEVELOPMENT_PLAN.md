# Federal Electronic Filing & Receipt Portal — Approved 60-unit development specification

The parent roadmap is `registry/prs.json`. IDs are **work units, not existing PR numbers**. Full acceptance expectations and dependency references live in that registry. Preserve all units and approved scope.

## Mandatory ownership test

If a feature is useful to both Federal Electronic Filing & Receipt Portal and National Secure Ideas Submission, implement that capability in Secure Intake & Case Workflow Engine; release and pin it before consuming it here. Federal statutory rules, agency directory, website terminology and authorized judiciary integration remain downstream. The `implementationOwner` field represents a candidate assessment; verify actual reusable gap and existing upstream implementation before editing either project. Never duplicate upstream behavior.

## Legislative convergence

The draft Federal Right to Electronic Filing and Verifiable Receipt Act informs software requirements. Upon software completion, perform explicit statutory-to-code traceability analysis and produce a round of bill revisions based on tested computer-code behavior. No draft law should be represented as enacted. No demo receipt establishes receipt by government.

## Units and phases

### Phase 1

- **UFR-001 — Canonical development plan and PR registry** (portal). Dependencies: none.
- **UFR-002 — System architecture authority and threat model** (portal). Dependencies: UFR-001.
- **UFR-003 — Application skeleton and CI** (portal). Dependencies: UFR-001, UFR-002.
- **UFR-004 — Reusable engine integration contracts** (portal). Dependencies: UFR-003.
- **UFR-005 — Federal legal policy and agency-domain registry** (portal). Dependencies: UFR-002, UFR-003.

### Phase 2

- **UFR-006 — Canonical receipt schema** (shared-engine-candidate). Dependencies: UFR-003.
- **UFR-007 — Authoritative time service** (shared-engine-candidate). Dependencies: UFR-006.
- **UFR-008 — Immutable original-submission manifest** (shared-engine-candidate). Dependencies: UFR-006.
- **UFR-009 — Atomic durable receipt transaction** (shared-engine-candidate). Dependencies: UFR-007, UFR-008.
- **UFR-010 — Protected digital receipt signing** (shared-engine-candidate). Dependencies: UFR-009.
- **UFR-011 — Public independent receipt verifier** (shared-engine-candidate). Dependencies: UFR-010.
- **UFR-012 — Idempotent filing and retry protection** (shared-engine-candidate). Dependencies: UFR-009.
- **UFR-013 — Durable receipt-event outbox** (shared-engine-candidate). Dependencies: UFR-009, UFR-012.
- **UFR-014 — Append-only cryptographic receipt ledger** (shared-engine-candidate). Dependencies: UFR-010, UFR-013.

### Phase 3

- **UFR-015 — Unified public website shell** (portal). Dependencies: UFR-003.
- **UFR-016 — Universal text-only filing** (portal). Dependencies: UFR-009, UFR-010, UFR-015.
- **UFR-017 — Guided filing navigation** (portal). Dependencies: UFR-005, UFR-016.
- **UFR-018 — Guided statutory forms** (portal). Dependencies: UFR-004, UFR-017.
- **UFR-019 — Draft saving and recovery** (portal). Dependencies: UFR-016.
- **UFR-020 — Receipt presentation and export** (portal). Dependencies: UFR-010, UFR-011, UFR-016.
- **UFR-021 — Secure claimant status tracking** (shared-engine-candidate). Dependencies: UFR-004, UFR-016.
- **UFR-022 — Amendments and supplementary filings** (shared-engine-candidate). Dependencies: UFR-008, UFR-020, UFR-021.

### Phase 4

- **UFR-023 — Protected identity compartments** (shared-engine-candidate). Dependencies: UFR-004, UFR-016.
- **UFR-024 — Staff authentication and authorization** (portal). Dependencies: UFR-004, UFR-023.
- **UFR-025 — Optional claimant accounts and recovery** (portal). Dependencies: UFR-021, UFR-023.
- **UFR-026 — Durable encrypted document storage** (shared-engine-candidate). Dependencies: UFR-008, UFR-023.
- **UFR-027 — Malware quarantine and document safety** (shared-engine-candidate). Dependencies: UFR-004, UFR-026.
- **UFR-028 — Resumable evidence uploads** (shared-engine-candidate). Dependencies: UFR-026, UFR-027.
- **UFR-029 — Accessibility and low-bandwidth operation** (portal). Dependencies: UFR-015, UFR-020.
- **UFR-030 — Language support and public assistance** (portal). Dependencies: UFR-017, UFR-029.

### Phase 5

- **UFR-031 — Authoritative Federal agency directory** (portal). Dependencies: UFR-005, UFR-004.
- **UFR-032 — Automatic routing without intake veto** (shared-engine-candidate). Dependencies: UFR-013, UFR-031.
- **UFR-033 — Reliable interagency delivery worker** (shared-engine-candidate). Dependencies: UFR-032.
- **UFR-034 — Reusable agency system adapters** (shared-engine-candidate). Dependencies: UFR-033.
- **UFR-035 — Official electronic intake addresses** (shared-engine-candidate). Dependencies: UFR-009, UFR-026.
- **UFR-036 — Existing official correspondence connectors** (shared-engine-candidate). Dependencies: UFR-035, UFR-031.
- **UFR-037 — Agency acknowledgments and correspondence** (shared-engine-candidate). Dependencies: UFR-004, UFR-033, UFR-021.
- **UFR-038 — Routing deadlines and administrative escalation** (shared-engine-candidate). Dependencies: UFR-032, UFR-033, UFR-037.

### Phase 6

- **UFR-039 — Versioned statutory deadline engine** (shared-engine-candidate). Dependencies: UFR-004, UFR-005, UFR-032.
- **UFR-040 — Federal Tort Claims Act workflow** (portal). Dependencies: UFR-018, UFR-039.
- **UFR-041 — FOIA requests and appeals** (portal). Dependencies: UFR-018, UFR-039.
- **UFR-042 — General administrative claims and appeals** (portal). Dependencies: UFR-018, UFR-039.
- **UFR-043 — Defect notices cure and relation back** (shared-engine-candidate). Dependencies: UFR-022, UFR-039.
- **UFR-044 — Emergency matter triage** (portal). Dependencies: UFR-032, UFR-038.
- **UFR-045 — Legally consequential notice delivery** (shared-engine-candidate). Dependencies: UFR-037, UFR-039.
- **UFR-046 — Federated Federal court filing gateway** (portal). Dependencies: UFR-010, UFR-011, UFR-015, UFR-029.
- **UFR-047 — Protected and classified-content handling** (portal). Dependencies: UFR-023, UFR-027, UFR-039.

### Phase 7

- **UFR-048 — Compliance Engine event integration** (shared-engine-candidate). Dependencies: UFR-004, UFR-014, UFR-038, UFR-039.
- **UFR-049 — Independent receipt witnessing** (shared-engine-candidate). Dependencies: UFR-014, UFR-048.
- **UFR-050 — Independent oversight dashboard** (shared-engine-candidate). Dependencies: UFR-048, UFR-049.
- **UFR-051 — Public accountability dashboard** (portal). Dependencies: UFR-048, UFR-050.
- **UFR-052 — Complaint and receipt-correction remedies** (shared-engine-candidate). Dependencies: UFR-021, UFR-048, UFR-050.
- **UFR-053 — Federal records preservation and disposition** (shared-engine-candidate). Dependencies: UFR-026, UFR-048.

### Phase 8

- **UFR-054 — Adversarial and insider-threat security testing** (shared-engine-candidate). Dependencies: UFR-010, UFR-024, UFR-048.
- **UFR-055 — E2EESA and secure release validation** (shared-engine-candidate). Dependencies: UFR-004, UFR-023, UFR-026, UFR-054.
- **UFR-056 — Abuse resilience without claimant exclusion** (shared-engine-candidate). Dependencies: UFR-016, UFR-027, UFR-054.
- **UFR-057 — High-availability intake and fallback** (shared-engine-candidate). Dependencies: UFR-009, UFR-013, UFR-026, UFR-033.
- **UFR-058 — Production observability and recovery** (shared-engine-candidate). Dependencies: UFR-055, UFR-057.
- **UFR-059 — Full-system release candidate acceptance** (portal). Dependencies: UFR-029, UFR-040, UFR-041, UFR-042, UFR-043, UFR-045, UFR-046, UFR-047, UFR-049, UFR-050, UFR-052, UFR-053, UFR-056, UFR-058.
- **UFR-060 — Government deployment and operational acceptance** (portal). Dependencies: UFR-059.

## Merge policy

Build, test, validate the canonical registry, inspect security and dependency impacts, then merge only after actual passing verification; CI unavailable or failing must never be treated as passing. Track deployment and external legal authorization separately from merged code. No blanket paid external-auditor gate on development. Use synthetic data until authorized live intake.
