import { createHash } from "node:crypto";
import { open } from "node:fs/promises";

export const MAX_REGISTRY_BYTES = 256 * 1024;
const REPOSITORY_SCHEMA = "ufr-agency-domains-v1";
const HEX = /^[0-9a-f]{64}$/;
const ID = /^[a-z][a-z0-9-]{2,63}$/;
const MAX_REVIEW_AGE_MS = 31 * 24 * 60 * 60 * 1000;
const registries = new WeakSet();
export const isAgencyRegistry = value => registries.has(value);
export class RegistryError extends Error {
  constructor(code) { super(code); this.name = "RegistryError"; this.code = code; }
}
const requireValue = (value, code) => { if (!value) throw new RegistryError(code); };
function keys(value, expected) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).sort().join(",") === [...expected].sort().join(",");
}
function time(value) {
  const parsed = typeof value === "string" ? Date.parse(value) : NaN;
  requireValue(Number.isFinite(parsed) && new Date(parsed).toISOString() === value, "REGISTRY_INVALID_TIME");
  return parsed;
}
function clockTime(value) {
  requireValue(Number.isSafeInteger(value) && value >= 0, "REGISTRY_INVALID_CLOCK");
  return value;
}
function domain(value) {
  requireValue(typeof value === "string" && value.length <= 253 &&
    value === value.toLowerCase() && value.includes(".") &&
    value.split(".").every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label) &&
      !label.startsWith("xn--")) && !/^[0-9.]+$/.test(value), "REGISTRY_INVALID_DOMAIN");
  return value;
}
function directorySource(value) {
  let url;
  try { url = new URL(value); } catch { throw new RegistryError("REGISTRY_INVALID_SOURCE"); }
  requireValue(typeof value === "string" && url.protocol === "https:" && !url.username &&
    !url.password && !url.port && !url.search && !url.hash &&
    url.hostname === "www.usa.gov" && /^\/agencies\/[a-z0-9-]+$/.test(url.pathname) &&
    url.href === value, "REGISTRY_INVALID_SOURCE");
  return value;
}

/** Trusted configuration pins the bytes; a source URL alone is not authentication. */
export function createAgencyRegistry(input, { expectedSha256, minimumRevision = 1, now = Date.now() } = {}) {
  requireValue(input instanceof Uint8Array && input.byteLength > 0 &&
    input.byteLength <= MAX_REGISTRY_BYTES, "REGISTRY_SIZE_LIMIT");
  requireValue(typeof expectedSha256 === "string" && HEX.test(expectedSha256), "REGISTRY_PIN_REQUIRED");
  requireValue(Number.isSafeInteger(minimumRevision) && minimumRevision >= 1, "REGISTRY_REVISION_REQUIRED");
  now = clockTime(now);
  const bytes = Buffer.from(input);
  const digest = createHash("sha256").update(bytes).digest("hex");
  requireValue(digest === expectedSha256, "REGISTRY_DIGEST_MISMATCH");
  let text, data;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    data = JSON.parse(text);
  } catch { throw new RegistryError("REGISTRY_INVALID_JSON"); }
  // The reviewable encoding also rejects duplicate members and lossy JSON numbers.
  requireValue(JSON.stringify(data, null, 2) + "\n" === text, "REGISTRY_NON_CANONICAL_JSON");
  requireValue(keys(data, ["schema", "revision", "authorityMode", "observedAt", "expiresAt", "agencies"]) &&
    data.schema === REPOSITORY_SCHEMA && data.authorityMode === "prototype", "REGISTRY_INVALID_SCHEMA");
  requireValue(Number.isSafeInteger(data.revision) && data.revision >= minimumRevision, "REGISTRY_REVISION_ROLLBACK");
  const observed = time(data.observedAt), expiry = time(data.expiresAt);
  requireValue(observed <= now && expiry > observed && expiry - observed <= MAX_REVIEW_AGE_MS,
    "REGISTRY_INVALID_VALIDITY");
  requireValue(now < expiry, "REGISTRY_EXPIRED");
  requireValue(Array.isArray(data.agencies) && data.agencies.length <= 500, "REGISTRY_INVALID_ENTRIES");
  const ids = new Set(), hosts = new Map();
  const agencies = data.agencies.map(entry => {
    requireValue(keys(entry, ["agencyId", "name", "domains", "sourceUrl", "verifiedAt"]) &&
      typeof entry.agencyId === "string" && ID.test(entry.agencyId) &&
      !ids.has(entry.agencyId) && typeof entry.name === "string" &&
      entry.name.trim().length > 0 && entry.name.length <= 200 && entry.name.isWellFormed() &&
      !/[\x00-\x1f\x7f]/.test(entry.name), "REGISTRY_INVALID_AGENCY");
    requireValue(Array.isArray(entry.domains) && entry.domains.length >= 1 &&
      entry.domains.length <= 20, "REGISTRY_INVALID_DOMAIN");
    const domains = entry.domains.map(domain);
    requireValue(new Set(domains).size === domains.length &&
      domains.every(host => !hosts.has(host)), "REGISTRY_DOMAIN_CONFLICT");
    const verified = time(entry.verifiedAt);
    requireValue(verified <= observed, "REGISTRY_FUTURE_VERIFICATION");
    requireValue(expiry - verified <= MAX_REVIEW_AGE_MS, "REGISTRY_STALE_SOURCE");
    directorySource(entry.sourceUrl);
    ids.add(entry.agencyId);
    const record = Object.freeze({ agencyId: entry.agencyId, name: entry.name,
      domains: Object.freeze(domains), sourceUrl: entry.sourceUrl, verifiedAt: entry.verifiedAt });
    for (const host of domains) hosts.set(host, record);
    return record;
  });
  Object.freeze(agencies);
  let lastNow = now;
  function current(value) {
    value = clockTime(value);
    requireValue(value >= lastNow, "REGISTRY_CLOCK_ROLLBACK");
    lastNow = value;
    requireValue(value < expiry, "REGISTRY_EXPIRED");
  }
  const registry = Object.freeze({
    snapshot(value = Date.now()) {
      current(value);
      return Object.freeze({ schemaVersion: 1, revision: data.revision, digest,
        status: agencies.length ? "reviewed-snapshot" : "empty", observedAt: data.observedAt,
        expiresAt: data.expiresAt, authority: "prototype-only", filingsAccepted: false, agencies });
    },
    lookup(candidate, value = Date.now()) {
      current(value);
      requireValue(typeof candidate === "string" && candidate.length <= 2048 &&
        !/[\\\x00-\x20\x7f]/.test(candidate), "REGISTRY_INVALID_URL");
      let url;
      try { url = new URL(candidate); } catch { throw new RegistryError("REGISTRY_INVALID_URL"); }
      requireValue(url.protocol === "https:" && !url.username && !url.password &&
        !url.port && !url.search && !url.hash && url.href === candidate, "REGISTRY_INVALID_URL");
      const record = hosts.get(url.hostname);
      return record ? Object.freeze({ agencyId: record.agencyId, name: record.name,
        host: url.hostname, sourceUrl: record.sourceUrl, status: "matched-reviewed-record",
        filingsAccepted: false, governmentReceiptVerified: false }) : null;
    },
  });
  registries.add(registry);
  return registry;
}

export async function loadAgencyRegistry(path, options) {
  let file;
  try {
    file = await open(path, "r");
    requireValue((await file.stat()).isFile(), "REGISTRY_FILE_UNAVAILABLE");
    const buffer = Buffer.alloc(MAX_REGISTRY_BYTES + 1);
    let total = 0;
    while (total < buffer.length) {
      const { bytesRead } = await file.read(buffer, total, buffer.length - total, total);
      if (!bytesRead) break;
      total += bytesRead;
    }
    requireValue(total <= MAX_REGISTRY_BYTES, "REGISTRY_SIZE_LIMIT");
    return createAgencyRegistry(buffer.subarray(0, total), options);
  } catch (error) {
    if (error instanceof RegistryError) throw error;
    throw new RegistryError("REGISTRY_FILE_UNAVAILABLE");
  } finally {
    if (file) try { await file.close(); }
    catch { throw new RegistryError("REGISTRY_FILE_UNAVAILABLE"); }
  }
}
