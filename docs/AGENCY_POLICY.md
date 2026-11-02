# UFR-005 Federal policy and agency-domain registry

The portal remains a development prototype. A website's domain, a reviewed directory entry, or a valid configuration digest does not establish authority to receive a filing. No statutory deadline, legal sufficiency rule, government receipt, court integration or live intake is implemented here.

## Executable contracts

- `GET /api/policy` returns `ufr-federal-prototype-v1`: filing/receipt authority, classified-content collection and authoritative deadline computation all remain disabled.
- `GET /api/agencies` returns a versioned read-only snapshot only when the backend has loaded a digest-pinned, current registry. Missing, expired or unavailable configuration returns 503 and no entries. Writes return 405. Liveness and upstream readiness retain their separate meanings.
- `createAgencyRegistry` accepts UTF-8 JSON bytes, a trusted expected SHA-256 and a minimum revision. `loadAgencyRegistry` bounds actual file reads to 256 KiB and conceals filesystem diagnostics. There is no network lookup or redirect following in either API.
- `lookup` matches an exact reviewed hostname. It does not infer subdomain ownership, accept lookalike suffixes, or treat a URL as a filing endpoint. It returns no claimant data and never reports filing acceptance.

The canonical configuration encoding is `JSON.stringify(data, null, 2) + "\n"`. Duplicate members, unsupported fields, malformed UTF-8, oversized input, ambiguous/conflicting domains and lossy JSON encodings fail validation. Registry and record review intervals are bounded to 31 days; this is an engineering review horizon, not a statutory period. Observed/verified times cannot be in the future. Time rollback cannot revive an expired snapshot.

Agency IDs are portal-local registry identifiers, not FOIA.gov component IDs. The UFR-031 directory unit must establish any complete component mapping. No fixed or inferred total agency count is used.

## Source review: November 1, 2026 (America/New_York)

Primary references checked during this activation:

1. https://get.gov/domains/eligibility/ — .gov eligibility includes federal, state, tribal and local governments. A suffix check cannot establish federal scope.
2. https://www.usa.gov/agencies/u-s-department-of-justice — the official USAGov agency entry links to `www.justice.gov`. The sample contains that exact host only; no unobserved alias or subdomain is inferred.
3. https://www.foia.gov/faq.html — agencies handle their own FOIA records and office-specific requirements. An agency homepage is not automatically an authorized filing route.

The one-record reviewed sample is intentionally incomplete and is not loaded by default. Its review timestamp records this source review; its expiry is a local re-review deadline. It is not a signed government registry, a frozen copy of those pages, a legally authoritative contact list or proof that an agency accepts this portal's filings.

## Trusted deployment configuration

For an explicitly selected registry file, configure all of:

- `PORTAL_AGENCY_REGISTRY`: local path mounted by the operator.
- `PORTAL_AGENCY_REGISTRY_SHA256`: independently pinned lowercase SHA-256 of the exact reviewed bytes.
- `PORTAL_AGENCY_REGISTRY_MIN_REVISION`: the deployment's minimum acceptable revision (default 1).

Compute/review the digest as part of source-controlled deployment preparation; do not accept it from the same HTTP request that supplies registry contents. Missing one half of the path/digest pair or invalid file contents aborts startup before binding the server. No credential or additional service is needed for local tests.

The digest authenticates the selected configuration against the trusted deployment pin. It does not independently verify facts on the linked source page. Source review is still required. Revision rollback across restarts is prevented by the independently maintained deployment minimum/pin, not by a fabricated persistent database. Files are read into a detached immutable snapshot; replacing a file in place cannot silently change a running registry.

## Verification and rollback

`npm run check` exercises the full foundation suite, registry validator, exact-host matching, spoofed/ambiguous URLs, duplicate domains, stale/future metadata, clock rollback, missing/tampered/oversized files, output mutation, real loopback HTTP and non-authorizing readiness.

To roll back, stop the process and deploy a previously reviewed source/configuration with an explicitly reviewed minimum revision and digest. Do not lower the revision floor or restore expired source data merely to make readiness green. No durable claimant record or receipt is written by this unit.
