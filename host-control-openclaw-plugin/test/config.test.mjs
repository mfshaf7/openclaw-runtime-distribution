import test from "node:test";
import assert from "node:assert/strict";

import { resolveHostControlConfig } from "../src/config.mjs";

test("resolveHostControlConfig requires an explicit bridge URL", () => {
  delete process.env.OPENCLAW_HOST_BRIDGE_URL;
  delete process.env.OPENCLAW_HOST_BRIDGE_TOKEN;
  assert.throws(
    () => resolveHostControlConfig({ pluginConfig: {} }),
    /requires plugin config\.bridgeUrl or OPENCLAW_HOST_BRIDGE_URL/,
  );
});

test("resolveHostControlConfig uses explicit plugin config and trims trailing slash", () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";
  const config = resolveHostControlConfig({
    pluginConfig: {
      bridgeUrl: "http://host.docker.internal:48721/",
      authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
      allowWriteOperations: true,
      allowAdminOperations: true,
      sharedPathMap: {
        from: "/home/example/.openclaw",
        to: "/home/node/.openclaw/",
      },
    },
  });
  assert.equal(config.bridgeUrl, "http://host.docker.internal:48721");
  assert.equal(config.authToken, "token");
  assert.equal(config.allowWriteOperations, true);
  assert.equal(config.allowAdminOperations, true);
  assert.deepEqual(config.sharedPathMap, {
    from: "/home/example/.openclaw",
    to: "/home/node/.openclaw",
  });
});

test("resolveHostControlConfig trims env-provided bridge settings", () => {
  process.env.OPENCLAW_HOST_BRIDGE_URL = "  http://host.docker.internal:48721/  ";
  process.env.OPENCLAW_HOST_BRIDGE_TOKEN = "  token-from-env  ";
  const config = resolveHostControlConfig({
    pluginConfig: {},
  });
  assert.equal(config.bridgeUrl, "http://host.docker.internal:48721");
  assert.equal(config.authToken, "token-from-env");
});
