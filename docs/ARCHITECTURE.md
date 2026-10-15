# Architecture and code ownership

## Public-facing system

A single, accessible website for Federal administrative claims, notices, petitions and appeals, with separate judiciary-controlled integration where authorized. The project is presently a prototype and is not a government recipient.

## Invariants

1. Receiving a submission is separate from review, routing, adjudication and legal sufficiency.
2. No agency employee can erase, backdate, or veto a durable original receipt.
3. Never report completed transmission without durable acceptance and authentic cryptographic evidence.
4. Routing, scanning, correspondence and case-creation failures do not overwrite receipts.
5. A tracking number by itself conveys no private-data access.
6. Classified information must not be sent through the unclassified portal.
7. Legislative authority and technically verifiable receipt are distinct.

## Ownership matrix

**Upstream Secure Intake:** generic durable submission lifecycle, configurable intake, evidence and quarantine, corrections, participant status, routing, deadline primitives, correspondence, append-only records and generic verifiable receipt capabilities where required by both consumers.

**Downstream Federal portal:** Federal law/policy packages, agency directory, citizen-facing presentation, optional court-filing adapters and statutory audit mappings.

**Compliance Engine:** generally reusable compliance rules, evidence, findings and independent audit; no duplicative Federal-only compliance engine.

**National Secure Ideas:** existing independent downstream consumer, retained as upstream backward-compatibility test case.

## Trust boundaries

Receiving authority, processing authority and oversight are separate trust domains. Staff may review legal sufficiency but cannot mutate the original record. No unapproved Federal intake or court-filing claims. Engine consumers communicate by versioned APIs, events and immutable pinned releases, not direct database writes.
