import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { healthResponse, readinessResponse } from "./health.mjs";
import { federalPrototypePolicy } from "./policy/federal-policy.mjs";
import { loadAgencyRegistry, isAgencyRegistry, RegistryError } from "./policy/agency-registry.mjs";

export function routePath(raw) {
  if (typeof raw !== "string" || raw.length === 0 ||
      !raw.startsWith("/") || raw.startsWith("//") ||
      /[\\\x00-\x1f\x7f]/.test(raw)) {
    return { status: 400, error: "invalid_request_target" };
  }
  if (raw.length > 2048) return { status: 414, error: "request_target_too_long" };
  try {
    const url = new URL(raw, "http://portal.invalid");
    if (url.origin !== "http://portal.invalid" || url.search || url.hash ||
        url.pathname !== raw) {
      return { status: 400, error: "invalid_request_target" };
    }
    return { path: url.pathname };
  } catch {
    return { status: 400, error: "invalid_request_target" };
  }
}

export function createPortalServer({ agencyRegistry = null, clock = Date.now } = {}) {
  if (typeof clock !== "function" ||
      agencyRegistry !== null && !isAgencyRegistry(agencyRegistry))
    throw new TypeError("Invalid portal configuration");
  const server = createServer((req, res) => {
    const target = routePath(req.url);
    let response;
    if (target.status) {
      response = { status: target.status, body: { error: target.error } };
    } else if (target.path === "/api/health") {
      response = healthResponse(target.path, req.method);
    } else if (target.path === "/api/ready") {
      response = readinessResponse(target.path, req.method);
    } else if (target.path === "/api/policy") {
      response = req.method === "GET"
        ? { status: 200, body: federalPrototypePolicy() }
        : { status: 405, body: { error: "method_not_allowed" } };
    } else if (target.path === "/api/agencies") {
      if (req.method !== "GET") {
        response = { status: 405, body: { error: "method_not_allowed" } };
      } else if (!agencyRegistry) {
        response = { status: 503, body: { schemaVersion: 1, status: "unconfigured",
          filingsAccepted: false, agencies: [] } };
      } else {
        try { response = { status: 200, body: agencyRegistry.snapshot(clock()) }; }
        catch (error) {
          response = { status: 503, body: { schemaVersion: 1, status: "unavailable",
            reason: error instanceof RegistryError &&
              ["REGISTRY_EXPIRED", "REGISTRY_CLOCK_ROLLBACK", "REGISTRY_INVALID_CLOCK"].includes(error.code)
              ? error.code : "REGISTRY_UNAVAILABLE",
            filingsAccepted: false, agencies: [] } };
        }
      }
    } else {
      response = { status: 404, body: { error: "not_found" } };
    }
    res.writeHead(response.status, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      ...(response.status === 405 ? { allow: "GET" } : {}),
    });
    res.end(JSON.stringify(response.body));
  });
  server.headersTimeout = 10000;
  server.requestTimeout = 10000;
  server.maxHeadersCount = 64;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new RangeError("Invalid PORT");
  }
  const host = process.env.PORTAL_BIND_HOST ?? "127.0.0.1";
  if (!["127.0.0.1", "::1", "0.0.0.0"].includes(host)) {
    throw new RangeError("Invalid PORTAL_BIND_HOST");
  }
  const registryPath = process.env.PORTAL_AGENCY_REGISTRY;
  const registryDigest = process.env.PORTAL_AGENCY_REGISTRY_SHA256;
  const minimumRevision = Number(process.env.PORTAL_AGENCY_REGISTRY_MIN_REVISION ?? 1);
  let agencyRegistry = null;
  if (registryPath !== undefined || registryDigest !== undefined) {
    if (!registryPath || !registryDigest) throw new Error("Registry path and digest must both be configured");
    agencyRegistry = await loadAgencyRegistry(registryPath, {
      expectedSha256: registryDigest, minimumRevision,
    });
  }
  createPortalServer({ agencyRegistry }).listen(port, host);
}

