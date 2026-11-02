import test from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import { healthResponse, readinessResponse } from "../src/health.mjs";
import { createPortalServer, routePath } from "../src/server.mjs";

test("health disclaims filing authority and readiness fails closed", () => {
  const health = healthResponse("/api/health", "GET");
  assert.equal(health.status, 200);
  assert.equal(health.body.schemaVersion, 1);
  assert.equal(health.body.authority, "prototype-only");
  assert.equal(health.body.filingsAccepted, false);
  const ready = readinessResponse("/api/ready", "GET");
  assert.equal(ready.status, 503);
  assert.equal(ready.body.reason, "upstream_unconfigured");
  assert.equal(ready.body.filingsAccepted, false);
});

test("unknown routes, unsafe methods and malformed request targets fail closed", () => {
  assert.equal(healthResponse("/api/file", "POST").status, 404);
  assert.equal(healthResponse("/api/health", "POST").status, 405);
  assert.equal(readinessResponse("/api/ready", "POST").status, 405);
  assert.equal(routePath("http://other.example/api/health").status, 400);
  assert.equal(routePath("//other.example/api/health").status, 400);
  assert.equal(routePath("/api/health?claimant=123").status, 400);
  for (const input of [
    "/api/health?", "/api/health#", "/api/x/../health",
    "/api/health/../health", "/api/%2e%2e/api/health",
    "/api/health/./", "/api/health%2f"
  ]) {
    const result = routePath(input);
    assert.notEqual(result.path, "/api/health");
  }
  assert.equal(routePath("/" + "a".repeat(2049)).status, 414);
});

test("HTTP server exposes only liveness and unavailable readiness", async () => {
  const server = createPortalServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = "http://127.0.0.1:" + address.port;
    const live = await fetch(base + "/api/health");
    assert.equal(live.status, 200);
    assert.equal(live.headers.get("cache-control"), "no-store");
    assert.equal(live.headers.get("x-content-type-options"), "nosniff");
    assert.equal((await live.json()).filingsAccepted, false);
    const ready = await fetch(base + "/api/ready");
    assert.equal(ready.status, 503);
    assert.equal((await ready.json()).ready, false);
    assert.equal((await fetch(base + "/api/file", { method: "POST" })).status, 404);
    const absolute = await new Promise((resolve, reject) => {
      const call = request({
        host: "127.0.0.1", port: address.port,
        path: "http://other.example/api/health", method: "GET",
      }, resolve);
      call.on("error", reject);
      call.end();
    });
    assert.equal(absolute.statusCode, 400);
    absolute.resume();
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
