import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAgencyRegistry, loadAgencyRegistry, MAX_REGISTRY_BYTES } from "../src/policy/agency-registry.mjs";
import { createPortalServer } from "../src/server.mjs";

const now = Date.parse("2026-11-02T00:24:00.000Z");
function fixture() {
  return { schema: "ufr-agency-domains-v1", revision: 2, authorityMode: "prototype",
    observedAt: "2026-11-02T00:00:00.000Z", expiresAt: "2026-11-03T00:00:00.000Z",
    agencies: [{ agencyId: "sample-agency", name: "Synthetic agency",
      domains: ["agency.example.gov"], sourceUrl: "https://www.usa.gov/agencies/synthetic-test-fixture",
      verifiedAt: "2026-11-01T23:59:00.000Z" }] };
}
const encode = data => Buffer.from(JSON.stringify(data, null, 2) + "\n");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
function registry(data = fixture(), extra = {}) {
  const bytes = encode(data);
  return createAgencyRegistry(bytes, { expectedSha256: hash(bytes), now, ...extra });
}
const rejects = (fn, code) => assert.throws(fn, error => error.code === code);

test("exact reviewed hosts match without inferring subdomain, .gov, routing or authority", () => {
  const r = registry();
  const matched = r.lookup("https://agency.example.gov/contact", now);
  assert.equal(matched.agencyId, "sample-agency");
  assert.equal(matched.filingsAccepted, false);
  assert.equal(matched.governmentReceiptVerified, false);
  for (const url of ["https://city.gov/", "https://agency.example.gov.attacker.example/",
    "https://other.agency.example.gov/", "https://agency.example.gov./"]) {
    assert.equal(r.lookup(url, now), null);
  }
  for (const url of ["http://agency.example.gov/", "https://user@agency.example.gov/",
    "https://agency.example.gov:8443/", "https://agency.example.gov/?private=content",
    "https://agency.example.gov/#fragment", "https://%61gency.example.gov/",
    "https://agency.example.gov/a/../", "https://agency.example.gov\\other"]) {
    rejects(() => r.lookup(url, now), "REGISTRY_INVALID_URL");
  }
});
test("the digest pin and minimum revision come from trusted configuration", () => {
  const bytes = encode(fixture());
  rejects(() => createAgencyRegistry(bytes, { now }), "REGISTRY_PIN_REQUIRED");
  rejects(() => createAgencyRegistry(bytes, { now, expectedSha256: "0".repeat(64) }), "REGISTRY_DIGEST_MISMATCH");
  rejects(() => registry(fixture(), { minimumRevision: 3 }), "REGISTRY_REVISION_ROLLBACK");
  rejects(() => registry(fixture(), { minimumRevision: 0 }), "REGISTRY_REVISION_REQUIRED");
  const data = fixture(); data.authorityMode = "government";
  rejects(() => registry(data), "REGISTRY_INVALID_SCHEMA");
});
test("unknown fields, duplicate identities and ambiguous domain ownership fail closed", () => {
  const data = fixture(); data.filingsAccepted = true;
  rejects(() => registry(data), "REGISTRY_INVALID_SCHEMA");
  const duplicate = fixture(); duplicate.agencies.push({ ...duplicate.agencies[0] });
  rejects(() => registry(duplicate), "REGISTRY_INVALID_AGENCY");
  const conflict = fixture(); conflict.agencies.push({ ...conflict.agencies[0], agencyId: "second-agency" });
  rejects(() => registry(conflict), "REGISTRY_DOMAIN_CONFLICT");
  for (const host of ["*.agency.gov", "AGENCY.gov", "127.0.0.1", "agency.gov:443",
    "xn--agency-123.gov", "-agency.gov", "agency..gov"]) {
    const bad = fixture(); bad.agencies[0].domains = [host];
    rejects(() => registry(bad), "REGISTRY_INVALID_DOMAIN");
  }
});
test("source provenance, UTC dates, freshness and time rollback are checked", () => {
  for (const source of ["https://attacker.example/agencies/sample", "http://www.usa.gov/agencies/sample",
    "https://www.usa.gov/agencies/sample?source=other", "https://www.usa.gov/agency-index"]) {
    const bad = fixture(); bad.agencies[0].sourceUrl = source;
    rejects(() => registry(bad), "REGISTRY_INVALID_SOURCE");
  }
  const future = fixture(); future.agencies[0].verifiedAt = "2026-11-02T00:01:00.000Z";
  rejects(() => registry(future), "REGISTRY_FUTURE_VERIFICATION");
  const staleSource = fixture(); staleSource.agencies[0].verifiedAt = "2025-11-02T00:00:00.000Z";
  rejects(() => registry(staleSource), "REGISTRY_STALE_SOURCE");
  const old = fixture(); old.expiresAt = "2026-11-02T00:10:00.000Z";
  rejects(() => registry(old), "REGISTRY_EXPIRED");
  const broad = fixture(); broad.expiresAt = "2027-11-02T00:00:00.000Z";
  rejects(() => registry(broad), "REGISTRY_INVALID_VALIDITY");
  const r = registry(), expiry = Date.parse(fixture().expiresAt);
  rejects(() => r.snapshot(expiry), "REGISTRY_EXPIRED");
  rejects(() => r.snapshot(now), "REGISTRY_CLOCK_ROLLBACK");
});
test("canonical JSON excludes duplicate keys and malformed/oversized bytes", () => {
  for (const raw of ['{"revision":1,"revision":2}', '{"x":NaN}', '{"x":1e400}', '[1,2]']) {
    const bytes = Buffer.from(raw);
    assert.throws(() => createAgencyRegistry(bytes, { expectedSha256: hash(bytes), now }));
  }
  const malformed = Buffer.from([0xff]);
  rejects(() => createAgencyRegistry(malformed, { expectedSha256: hash(malformed), now }), "REGISTRY_INVALID_JSON");
  rejects(() => createAgencyRegistry(new Uint8Array(MAX_REGISTRY_BYTES + 1), { expectedSha256: "a".repeat(64), now }), "REGISTRY_SIZE_LIMIT");
});
test("registry outputs are detached, immutable snapshots", () => {
  const data = fixture(), bytes = encode(data), r = createAgencyRegistry(bytes, { expectedSha256: hash(bytes), now });
  bytes.fill(0); data.agencies[0].domains[0] = "attacker.example";
  const snapshot = r.snapshot(now);
  assert.equal(snapshot.agencies[0].domains[0], "agency.example.gov");
  assert.throws(() => snapshot.agencies[0].domains.push("attacker.example"));
  assert.equal(r.lookup("https://attacker.example/", now), null);
});
test("bounded file loading rejects missing, changed and oversized configuration", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ufr-registry-"));
  try {
    const path = join(dir, "registry.json"), bytes = encode(fixture());
    await writeFile(path, bytes);
    assert.equal((await loadAgencyRegistry(path, { expectedSha256: hash(bytes), now })).snapshot(now).revision, 2);
    await writeFile(path, encode({ ...fixture(), revision: 3 }));
    await assert.rejects(loadAgencyRegistry(path, { expectedSha256: hash(bytes), now }), error => error.code === "REGISTRY_DIGEST_MISMATCH");
    await writeFile(path, Buffer.alloc(MAX_REGISTRY_BYTES + 1));
    await assert.rejects(loadAgencyRegistry(path, { expectedSha256: hash(bytes), now }), error => error.code === "REGISTRY_SIZE_LIMIT");
    await assert.rejects(loadAgencyRegistry(join(dir, "missing"), { expectedSha256: hash(bytes), now }), error =>
      error.code === "REGISTRY_FILE_UNAVAILABLE" && !error.message.includes(dir));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test("actual HTTP policy and registry endpoints remain read-only and non-authorizing", async () => {
  let clock = now;
  const server = createPortalServer({ agencyRegistry: registry(), clock: () => clock });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const base = "http://127.0.0.1:" + server.address().port;
    const policy = await (await fetch(base + "/api/policy")).json();
    assert.equal(policy.filingsAccepted, false);
    assert.equal(policy.classifiedContentAccepted, false);
    const response = await fetch(base + "/api/agencies");
    assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal((await response.json()).agencies.length, 1);
    assert.equal((await fetch(base + "/api/agencies", { method: "POST" })).status, 405);
    assert.equal((await fetch(base + "/api/policy", { method: "POST" })).status, 405);
    assert.equal((await fetch(base + "/api/ready")).status, 503);
    clock = Date.parse(fixture().expiresAt);
    const stale = await fetch(base + "/api/agencies");
    assert.equal(stale.status, 503); assert.deepEqual((await stale.json()).agencies, []);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
test("an unconfigured registry exposes no invented directory or ready state", async () => {
  const server = createPortalServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const response = await fetch("http://127.0.0.1:" + server.address().port + "/api/agencies");
    assert.equal(response.status, 503); assert.equal((await response.json()).status, "unconfigured");
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
test("unvalidated registry objects cannot impersonate configuration and clock errors are redacted", async () => {
  assert.throws(() => createPortalServer({ agencyRegistry: { snapshot: () => ({ filingsAccepted: true }) } }));
  assert.throws(() => createPortalServer({ agencyRegistry: { ...registry() } }));
  const server = createPortalServer({ agencyRegistry: registry(), clock: () => { throw new Error("private dependency details"); } });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const base = "http://127.0.0.1:" + server.address().port;
    const response = await fetch(base + "/api/agencies");
    assert.equal(response.status, 503);
    const body = await response.text();
    assert.ok(!body.includes("private dependency details"));
    assert.equal(JSON.parse(body).filingsAccepted, false);
    assert.equal((await fetch(base + "/api/health")).status, 200);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
