import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createHostControlTools } from "../src/tools.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, "..", "contracts", "interface-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

function buildTools(pluginConfig = {}, toolContext = {}) {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";
  return createHostControlTools({
    pluginConfig: {
      bridgeUrl: "http://host.docker.internal:48721",
      authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
      ...pluginConfig,
    },
    toolContext: {
      messageChannel: "telegram",
      sessionKey: "agent:host-control:telegram:direct:test",
      requesterSenderId: "1337",
      ...toolContext,
    },
  });
}

function namesForGate(gate) {
  return manifest.tools.filter((entry) => entry.gate === gate).map((entry) => entry.name);
}

function sampleArgs(entry, { includeConfirm = false } = {}) {
  const args = {};
  switch (entry.name) {
    case "host_control_fs_list":
    case "host_control_list_host_folder":
      args.path = "desktop";
      break;
    case "host_control_fs_search":
    case "host_control_find_host_files":
      args.root = "desktop";
      args.pattern = "*resume*";
      args.limit = 5;
      break;
    case "host_control_find_in_allowed_roots":
      args.pattern = "*resume*";
      args.limit = 5;
      break;
    case "host_control_fs_read_meta":
      args.path = "desktop/resume.pdf";
      break;
    case "host_control_fs_mkdir":
      args.path = "desktop/new-folder";
      break;
    case "host_control_fs_move":
      args.source = "desktop/source.txt";
      args.destination = "desktop/destination.txt";
      break;
    case "host_control_fs_quarantine":
      args.path = "desktop/source.txt";
      break;
    case "host_control_stage_for_telegram":
    case "host_control_send_file_to_telegram":
      args.path = "desktop/resume.pdf";
      break;
    default:
      break;
  }
  if (includeConfirm) {
    args.confirm = true;
  }
  return args;
}

function fakeBridgeResult(operation, args) {
  switch (operation) {
    case "health.check":
      return { ok: true, bridge: "healthy" };
    case "config.allowed_roots.list":
      return { roots: ["desktop"] };
    case "fs.list":
      return { path: args.path ?? "desktop", entries: [] };
    case "fs.search":
      return { root: args.root ?? "desktop", pattern: args.pattern ?? "*", results: [] };
    case "fs.read_meta":
      return { path: args.path ?? "desktop/resume.pdf", type: "file", size: 42 };
    case "fs.mkdir":
      return { path: args.path ?? "desktop/new-folder", created: true };
    case "fs.move":
      return { source: args.source ?? "desktop/source.txt", destination: args.destination ?? "desktop/destination.txt", moved: true };
    case "fs.quarantine":
      return { source: args.path ?? "desktop/source.txt", destination: "/tmp/quarantine/source.txt", quarantined: true };
    case "display.monitor_power":
      return { action: args.action ?? "off", changed: true };
    case "fs.stage_for_telegram":
      return { path: "/tmp/openclaw-staging/export.bin", staged: true };
    case "display.screenshot":
      return { path: "/tmp/openclaw-staging/desktop-screenshot.png", captured: true };
    default:
      return { ok: true };
  }
}

test("interface manifest matches gated tool registration", () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.contractId, "host-control-openclaw-plugin.interface.v1");
  assert.equal(manifest.ownerRepo, "openclaw-runtime-distribution");
  assert.equal(manifest.bridgeOwnerRepo, "openclaw-host-bridge");

  const defaultTools = new Set(buildTools().map((entry) => entry.name));
  const fullTools = new Set(
    buildTools({
      allowWriteOperations: true,
      allowAdminOperations: true,
      allowExportOperations: true,
    }).map((entry) => entry.name),
  );

  assert.deepEqual([...defaultTools].sort(), namesForGate("always").sort());
  assert.deepEqual(
    [...fullTools].sort(),
    manifest.tools.map((entry) => entry.name).sort(),
  );

  for (const forbiddenName of manifest.forbiddenToolNames) {
    assert.ok(!fullTools.has(forbiddenName), `forbidden tool unexpectedly exposed: ${forbiddenName}`);
  }
});

test("interface manifest bridge operations match live tool execution", async () => {
  const originalFetch = globalThis.fetch;
  const tools = new Map(
    buildTools({
      allowWriteOperations: true,
      allowAdminOperations: true,
      allowExportOperations: true,
      sharedPathMap: {
        from: "/tmp/openclaw-staging",
        to: "/container-staging",
      },
    }).map((entry) => [entry.name, entry]),
  );

  try {
    for (const entry of manifest.tools) {
      const requests = [];
      globalThis.fetch = async (_url, init) => {
        const body = JSON.parse(init.body);
        requests.push(body.operation);
        return {
          ok: true,
          async json() {
            return {
              ok: true,
              result: fakeBridgeResult(body.operation, body.arguments ?? {}),
            };
          },
        };
      };

      const tool = tools.get(entry.name);
      assert.ok(tool, `expected ${entry.name} to be registered`);
      const result = await tool.execute(
        `call-${entry.name}`,
        sampleArgs(entry, {
          includeConfirm: entry.requiresConfirm && !entry.telegramConfirmBypass,
        }),
      );
      assert.deepEqual(
        requests,
        entry.bridgeOperations,
        `bridge operation drift for ${entry.name}`,
      );
      if (entry.resultKind === "media") {
        assert.match(result.content[0].text, /^MEDIA:/);
      } else {
        assert.match(result.content[0].text, /^{/);
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("telegram confirm bypass stays aligned with the published contract", async () => {
  const bypassEntries = manifest.tools.filter((entry) => entry.telegramConfirmBypass);
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(init.body);
      return {
        ok: true,
        async json() {
          return {
            ok: true,
            result: fakeBridgeResult(body.operation, body.arguments ?? {}),
          };
        },
      };
    };

    const telegramTools = new Map(
      buildTools({
        allowExportOperations: true,
        sharedPathMap: {
          from: "/tmp/openclaw-staging",
          to: "/container-staging",
        },
      }).map((entry) => [entry.name, entry]),
    );
    for (const entry of bypassEntries) {
      const tool = telegramTools.get(entry.name);
      assert.ok(tool, `expected ${entry.name} to be registered in Telegram context`);
      await tool.execute(`call-${entry.name}-telegram`, sampleArgs(entry));
    }

    const webTools = new Map(
      buildTools(
        {
          allowExportOperations: true,
        },
        {
          messageChannel: "web",
          sessionKey: "agent:main:web:test",
        },
      ).map((entry) => [entry.name, entry]),
    );
    for (const entry of bypassEntries) {
      const tool = webTools.get(entry.name);
      assert.ok(tool, `expected ${entry.name} to be registered in web context`);
      await assert.rejects(
        () => tool.execute(`call-${entry.name}-web`, sampleArgs(entry)),
        /requires confirm=true/,
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
