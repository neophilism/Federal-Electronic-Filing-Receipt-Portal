import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { createAgencyRegistry } from "../src/policy/agency-registry.mjs";

test("the reviewed sample is a valid single-host, explicitly incomplete configuration", async () => {
  const bytes = await readFile(new URL("../config/agency-registry.reviewed-sample.json", import.meta.url));
  const digest = createHash("sha256").update(bytes).digest("hex");
  const now = Date.parse("2026-11-02T01:00:00.000Z");
  const snapshot = createAgencyRegistry(bytes, { expectedSha256: digest, now }).snapshot(now);
  assert.equal(snapshot.agencies.length, 1);
  assert.deepEqual(snapshot.agencies[0].domains, ["www.justice.gov"]);
  assert.equal(snapshot.filingsAccepted, false);
});
test("invalid operator configuration aborts the actual process before it listens", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ufr-config-"));
  try {
    const path = join(dir, "private-config-name.json");
    await writeFile(path, "{}\n");
    const digest = createHash("sha256").update("{}\n").digest("hex");
    const cases = [
      [{ PORTAL_AGENCY_REGISTRY: path }, "Registry path and digest"],
      [{ PORTAL_AGENCY_REGISTRY_SHA256: digest }, "Registry path and digest"],
      [{ PORTAL_AGENCY_REGISTRY: path, PORTAL_AGENCY_REGISTRY_SHA256: "0".repeat(64) }, "REGISTRY_DIGEST_MISMATCH"],
      [{ PORTAL_AGENCY_REGISTRY: join(dir, "missing"), PORTAL_AGENCY_REGISTRY_SHA256: digest }, "REGISTRY_FILE_UNAVAILABLE"],
      [{ PORTAL_AGENCY_REGISTRY: path, PORTAL_AGENCY_REGISTRY_SHA256: digest,
        PORTAL_AGENCY_REGISTRY_MIN_REVISION: "invalid" }, "REGISTRY_REVISION_REQUIRED"],
    ];
    for (const [overrides, message] of cases) {
      const env = { ...process.env, PORT: "32123", PORTAL_BIND_HOST: "127.0.0.1" };
      delete env.PORTAL_AGENCY_REGISTRY;
      delete env.PORTAL_AGENCY_REGISTRY_SHA256;
      delete env.PORTAL_AGENCY_REGISTRY_MIN_REVISION;
      const result = spawnSync(process.execPath, ["src/server.mjs"], {
        env: { ...env, ...overrides }, encoding: "utf8", timeout: 2000,
      });
      assert.equal(result.error, undefined);
      assert.notEqual(result.status, 0);
      assert.ok(result.stderr.includes(message), result.stderr);
      assert.ok(!result.stderr.includes("private-config-name"));
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});
