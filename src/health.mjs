const service = "federal-electronic-filing-receipt-portal";

/** Prototype-only process liveness. Never asserts official filing authority. */
export function healthResponse(path, method) {
  if (path !== "/api/health") return { status: 404, body: { error: "not_found" } };
  if (method !== "GET") return { status: 405, body: { error: "method_not_allowed" } };
  return {
    status: 200,
    body: {
      schemaVersion: 1, service, ok: true,
      authority: "prototype-only", filingsAccepted: false,
    },
  };
}

/** No upstream contract is configured in the skeleton, so intake is unavailable. */
export function readinessResponse(path, method) {
  if (path !== "/api/ready") return { status: 404, body: { error: "not_found" } };
  if (method !== "GET") return { status: 405, body: { error: "method_not_allowed" } };
  return {
    status: 503,
    body: {
      schemaVersion: 1, service, ready: false,
      reason: "upstream_unconfigured", filingsAccepted: false,
    },
  };
}
