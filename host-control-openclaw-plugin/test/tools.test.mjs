import test from "node:test";
import assert from "node:assert/strict";

import { createHostControlTools } from "../src/tools.mjs";

test("createHostControlTools registers read tools without requiring bridge config at load time", () => {
  delete process.env.OPENCLAW_HOST_BRIDGE_URL;
  delete process.env.OPENCLAW_HOST_BRIDGE_TOKEN;

  const tools = createHostControlTools({
    pluginConfig: {},
    toolContext: {
      messageChannel: "web",
      sessionKey: "agent:main:test",
      requesterSenderId: "1337",
    },
  });

  assert.ok(tools.find((entry) => entry.name === "host_control_health_check"));
  assert.ok(!tools.find((entry) => entry.name === "host_control_fs_mkdir"));
  assert.ok(!tools.find((entry) => entry.name === "host_control_send_file_to_telegram"));
});

test("stage_for_telegram export tool emits MEDIA:path for staged files", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        ok: true,
        result: {
          path: "/tmp/openclaw-staging/resume.pdf",
          staged: true,
        },
      };
    },
  });

  try {
    const tools = createHostControlTools({
      pluginConfig: {
        bridgeUrl: "http://host.docker.internal:48721",
        authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
        allowExportOperations: true,
        sharedPathMap: {
          from: "/tmp/openclaw-staging",
          to: "/container-staging",
        },
      },
      toolContext: {
        messageChannel: "telegram",
        sessionKey: "agent:main:telegram:direct:test",
        requesterSenderId: "1337",
      },
    });
    const tool = tools.find((entry) => entry.name === "host_control_stage_for_telegram");
    assert.ok(tool, "expected stage_for_telegram tool to be registered");

    const result = await tool.execute("call-1", {
      path: "Downloads/resume.pdf",
      confirm: true,
    });

    assert.deepEqual(result.content, [{ type: "text", text: "MEDIA:/container-staging/resume.pdf" }]);
    assert.equal(result.details.path, "/container-staging/resume.pdf");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("send_file_to_telegram tool emits MEDIA:path for staged files", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        ok: true,
        result: {
          path: "/tmp/openclaw-staging/resume.docx",
          staged: true,
        },
      };
    },
  });

  try {
    const tools = createHostControlTools({
      pluginConfig: {
        bridgeUrl: "http://host.docker.internal:48721",
        authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
        allowExportOperations: true,
        sharedPathMap: {
          from: "/tmp/openclaw-staging",
          to: "/container-staging",
        },
      },
      toolContext: {
        messageChannel: "telegram",
        sessionKey: "agent:main:telegram:direct:test",
        requesterSenderId: "1337",
      },
    });
    const tool = tools.find((entry) => entry.name === "host_control_send_file_to_telegram");
    assert.ok(tool, "expected send_file_to_telegram tool to be registered");

    const result = await tool.execute("call-send", {
      path: "desktop/resume.docx",
      confirm: true,
    });

    assert.deepEqual(result.content, [{ type: "text", text: "MEDIA:/container-staging/resume.docx" }]);
    assert.equal(result.details.path, "/container-staging/resume.docx");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("stage_for_telegram in Telegram DM does not require an extra confirm flag", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        ok: true,
        result: {
          path: "/tmp/openclaw-staging/portfolio.docx",
          staged: true,
        },
      };
    },
  });

  try {
    const tools = createHostControlTools({
      pluginConfig: {
        bridgeUrl: "http://host.docker.internal:48721",
        authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
        allowExportOperations: true,
        sharedPathMap: {
          from: "/tmp/openclaw-staging",
          to: "/container-staging",
        },
      },
      toolContext: {
        messageChannel: "telegram",
        sessionKey: "agent:main:telegram:direct:test",
        requesterSenderId: "1337",
      },
    });
    const tool = tools.find((entry) => entry.name === "host_control_stage_for_telegram");
    assert.ok(tool, "expected stage_for_telegram tool to be registered");

    const result = await tool.execute("call-stage-no-confirm", {
      path: "desktop/portfolio.docx",
    });

    assert.deepEqual(result.content, [
      { type: "text", text: "MEDIA:/container-staging/portfolio.docx" },
    ]);
    assert.equal(result.details.path, "/container-staging/portfolio.docx");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("send_file_to_telegram in Telegram DM does not require an extra confirm flag", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        ok: true,
        result: {
          path: "/tmp/openclaw-staging/portfolio.docx",
          staged: true,
        },
      };
    },
  });

  try {
    const tools = createHostControlTools({
      pluginConfig: {
        bridgeUrl: "http://host.docker.internal:48721",
        authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
        allowExportOperations: true,
        sharedPathMap: {
          from: "/tmp/openclaw-staging",
          to: "/container-staging",
        },
      },
      toolContext: {
        messageChannel: "telegram",
        sessionKey: "agent:main:telegram:direct:test",
        requesterSenderId: "1337",
      },
    });
    const tool = tools.find((entry) => entry.name === "host_control_send_file_to_telegram");
    assert.ok(tool, "expected send_file_to_telegram tool to be registered");

    const result = await tool.execute("call-send-no-confirm", {
      path: "desktop/portfolio.docx",
    });

    assert.deepEqual(result.content, [
      { type: "text", text: "MEDIA:/container-staging/portfolio.docx" },
    ]);
    assert.equal(result.details.path, "/container-staging/portfolio.docx");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("send_file_to_telegram still requires confirm outside Telegram delivery contexts", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const tools = createHostControlTools({
    pluginConfig: {
      bridgeUrl: "http://host.docker.internal:48721",
      authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
      allowExportOperations: true,
    },
    toolContext: {
      messageChannel: "web",
      sessionKey: "agent:main:main",
      requesterSenderId: "1337",
    },
  });
  const tool = tools.find((entry) => entry.name === "host_control_send_file_to_telegram");
  assert.ok(tool, "expected send_file_to_telegram tool to be registered");

  await assert.rejects(
    () =>
      tool.execute("call-send-requires-confirm", {
        path: "desktop/portfolio.docx",
      }),
    /requires confirm=true/,
  );
});

test("capture_desktop_screenshot emits MEDIA:path for staged screenshots", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const originalFetch = globalThis.fetch;
  let capturedRequest;
  globalThis.fetch = async (_url, init) => {
    capturedRequest = JSON.parse(init.body);
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            path: "/tmp/openclaw-staging/desktop-screenshot.png",
            captured: true,
          },
        };
      },
    };
  };

  try {
    const tools = createHostControlTools({
      pluginConfig: {
        bridgeUrl: "http://host.docker.internal:48721",
        authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
        allowExportOperations: true,
        sharedPathMap: {
          from: "/tmp/openclaw-staging",
          to: "/container-staging",
        },
      },
      toolContext: {
        messageChannel: "telegram",
        sessionKey: "agent:main:telegram:direct:test",
        requesterSenderId: "1337",
      },
    });
    const tool = tools.find((entry) => entry.name === "host_control_capture_desktop_screenshot");
    assert.ok(tool, "expected capture_desktop_screenshot tool to be registered");

    const result = await tool.execute("call-shot", { confirm: true });

    assert.equal(capturedRequest.operation, "display.screenshot");
    assert.deepEqual(result.content, [
      { type: "text", text: "MEDIA:/container-staging/desktop-screenshot.png" },
    ]);
    assert.equal(result.details.path, "/container-staging/desktop-screenshot.png");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("send_desktop_screenshot_to_telegram emits MEDIA:path for staged screenshots", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const originalFetch = globalThis.fetch;
  let capturedRequest;
  globalThis.fetch = async (_url, init) => {
    capturedRequest = JSON.parse(init.body);
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            path: "/tmp/openclaw-staging/desktop-screenshot.png",
            captured: true,
          },
        };
      },
    };
  };

  try {
    const tools = createHostControlTools({
      pluginConfig: {
        bridgeUrl: "http://host.docker.internal:48721",
        authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
        allowExportOperations: true,
        sharedPathMap: {
          from: "/tmp/openclaw-staging",
          to: "/container-staging",
        },
      },
      toolContext: {
        messageChannel: "telegram",
        sessionKey: "agent:main:telegram:direct:test",
        requesterSenderId: "1337",
      },
    });
    const tool = tools.find((entry) => entry.name === "host_control_send_desktop_screenshot_to_telegram");
    assert.ok(tool, "expected send_desktop_screenshot_to_telegram tool to be registered");

    const result = await tool.execute("call-shot-send", { confirm: true });

    assert.equal(capturedRequest.operation, "display.screenshot");
    assert.deepEqual(result.content, [
      { type: "text", text: "MEDIA:/container-staging/desktop-screenshot.png" },
    ]);
    assert.equal(result.details.path, "/container-staging/desktop-screenshot.png");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("capture_desktop_screenshot emits one MEDIA block per captured display", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        ok: true,
        result: {
          path: "/tmp/openclaw-staging/desktop-screenshot-display-1.png",
          paths: [
            "/tmp/openclaw-staging/desktop-screenshot-display-1.png",
            "/tmp/openclaw-staging/desktop-screenshot-display-2.png",
          ],
          displays: [
            { path: "/tmp/openclaw-staging/desktop-screenshot-display-1.png", primary: true },
            { path: "/tmp/openclaw-staging/desktop-screenshot-display-2.png", primary: false },
          ],
          captured: true,
        },
      };
    },
  });

  try {
    const tools = createHostControlTools({
      pluginConfig: {
        bridgeUrl: "http://host.docker.internal:48721",
        authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
        allowExportOperations: true,
        sharedPathMap: {
          from: "/tmp/openclaw-staging",
          to: "/container-staging",
        },
      },
      toolContext: {
        messageChannel: "telegram",
        sessionKey: "agent:main:telegram:direct:test",
        requesterSenderId: "1337",
      },
    });
    const tool = tools.find((entry) => entry.name === "host_control_capture_desktop_screenshot");
    assert.ok(tool, "expected capture_desktop_screenshot tool to be registered");

    const result = await tool.execute("call-shot-multi", { confirm: true });

    assert.deepEqual(result.content, [
      { type: "text", text: "MEDIA:/container-staging/desktop-screenshot-display-1.png" },
      { type: "text", text: "MEDIA:/container-staging/desktop-screenshot-display-2.png" },
    ]);
    assert.deepEqual(result.details.paths, [
      "/container-staging/desktop-screenshot-display-1.png",
      "/container-staging/desktop-screenshot-display-2.png",
    ]);
    assert.equal(result.details.displays[0].path, "/container-staging/desktop-screenshot-display-1.png");
    assert.equal(result.details.displays[1].path, "/container-staging/desktop-screenshot-display-2.png");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("host folder and host search aliases are registered", () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const tools = createHostControlTools({
    pluginConfig: {
      bridgeUrl: "http://host.docker.internal:48721",
      authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
      allowExportOperations: true,
    },
    toolContext: {
      messageChannel: "telegram",
      sessionKey: "agent:main:telegram:direct:test",
      requesterSenderId: "1337",
    },
  });

  assert.ok(tools.find((entry) => entry.name === "host_control_list_host_folder"));
  assert.ok(tools.find((entry) => entry.name === "host_control_find_host_files"));
  assert.ok(tools.find((entry) => entry.name === "host_control_find_in_allowed_roots"));
  assert.ok(tools.find((entry) => entry.name === "host_control_send_file_to_telegram"));
  assert.ok(tools.find((entry) => entry.name === "host_control_capture_desktop_screenshot"));
  assert.ok(tools.find((entry) => entry.name === "host_control_send_desktop_screenshot_to_telegram"));
});

test("find_in_allowed_roots searches the roots exposed by bridge policy without broad roots", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    requests.push({ operation: body.operation, arguments: body.arguments });
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            ...(body.operation === "config.allowed_roots.list"
              ? {
                  roots: [
                    "/mnt/c/Users/Example/Desktop",
                    "/mnt/c/Users/Example/Projects",
                    "/mnt/c/Users/Example/Downloads",
                  ],
                }
              : {
                  results:
                    body.arguments.root === "/mnt/c/Users/Example/Projects"
                      ? [{ path: "/mnt/c/Users/Example/Projects/resume.docx", size: 123 }]
                      : [],
                }),
          },
        };
      },
    };
  };

  try {
    const tools = createHostControlTools({
      pluginConfig: {
        bridgeUrl: "http://host.docker.internal:48721",
        authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
      },
      toolContext: {
        messageChannel: "telegram",
        sessionKey: "agent:main:telegram:direct:test",
        requesterSenderId: "1337",
      },
    });
    const tool = tools.find((entry) => entry.name === "host_control_find_in_allowed_roots");
    assert.ok(tool, "expected find_in_allowed_roots tool to be registered");

    const result = await tool.execute("call-find", {
      pattern: "*resume*.*",
      limit: 5,
    });

    const payload = JSON.parse(result.content[0].text);
    assert.deepEqual(
      requests.map((entry) => entry.operation),
      ["config.allowed_roots.list", "fs.search", "fs.search", "fs.search"],
    );
    assert.deepEqual(
      requests.slice(1).map((entry) => entry.arguments.root),
      [
        "/mnt/c/Users/Example/Desktop",
        "/mnt/c/Users/Example/Projects",
        "/mnt/c/Users/Example/Downloads",
      ],
    );
    assert.equal(payload.results.length, 1);
    assert.equal(payload.results[0].matched_root, "/mnt/c/Users/Example/Projects");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("search tool rewrites guessed Linux home desktop paths to host aliases", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const originalFetch = globalThis.fetch;
  let capturedRequest;
  globalThis.fetch = async (_url, init) => {
    capturedRequest = JSON.parse(init.body);
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            matches: [],
          },
        };
      },
    };
  };

  try {
    const tools = createHostControlTools({
      pluginConfig: {
        bridgeUrl: "http://host.docker.internal:48721",
        authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
      },
      toolContext: {
        messageChannel: "telegram",
        sessionKey: "agent:main:telegram:direct:test",
        requesterSenderId: "1337",
      },
    });
    const tool = tools.find((entry) => entry.name === "host_control_fs_search");
    assert.ok(tool, "expected fs_search tool to be registered");

    await tool.execute("call-2", {
      root: "/home/Fahmi/Desktop",
      pattern: "*.docx",
      limit: 10,
    });

    assert.equal(capturedRequest.arguments.root, "desktop");
    assert.equal(capturedRequest.arguments.pattern, "*.docx");
    assert.equal(capturedRequest.arguments.limit, 10);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("list tool rewrites guessed Windows profile desktop paths to host aliases", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const originalFetch = globalThis.fetch;
  let capturedRequest;
  globalThis.fetch = async (_url, init) => {
    capturedRequest = JSON.parse(init.body);
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            entries: [],
          },
        };
      },
    };
  };

  try {
    const tools = createHostControlTools({
      pluginConfig: {
        bridgeUrl: "http://host.docker.internal:48721",
        authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
      },
      toolContext: {
        messageChannel: "telegram",
        sessionKey: "agent:main:telegram:direct:test",
        requesterSenderId: "1337",
      },
    });
    const tool = tools.find((entry) => entry.name === "host_control_fs_list");
    assert.ok(tool, "expected fs_list tool to be registered");

    await tool.execute("call-2b", {
      path: "C:\\Users\\ExampleUser\\Desktop",
    });

    assert.equal(capturedRequest.arguments.path, "desktop");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("search tool rewrites guessed WSL profile desktop paths to host aliases", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const originalFetch = globalThis.fetch;
  let capturedRequest;
  globalThis.fetch = async (_url, init) => {
    capturedRequest = JSON.parse(init.body);
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            results: [],
          },
        };
      },
    };
  };

  try {
    const tools = createHostControlTools({
      pluginConfig: {
        bridgeUrl: "http://host.docker.internal:48721",
        authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
      },
      toolContext: {
        messageChannel: "telegram",
        sessionKey: "agent:main:telegram:direct:test",
        requesterSenderId: "1337",
      },
    });
    const tool = tools.find((entry) => entry.name === "host_control_fs_search");
    assert.ok(tool, "expected fs_search tool to be registered");

    await tool.execute("call-2c", {
      root: "/mnt/c/Users/ExampleUser/Desktop",
      pattern: "*.docx",
      limit: 10,
    });

    assert.equal(capturedRequest.arguments.root, "desktop");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("move tool rewrites guessed Linux home paths in source and destination", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const originalFetch = globalThis.fetch;
  let capturedRequest;
  globalThis.fetch = async (_url, init) => {
    capturedRequest = JSON.parse(init.body);
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            status: "ok",
          },
        };
      },
    };
  };

  try {
    const tools = createHostControlTools({
      pluginConfig: {
        bridgeUrl: "http://host.docker.internal:48721",
        authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
        allowWriteOperations: true,
      },
      toolContext: {
        messageChannel: "telegram",
        sessionKey: "agent:main:telegram:direct:test",
        requesterSenderId: "1337",
      },
    });
    const tool = tools.find((entry) => entry.name === "host_control_fs_move");
    assert.ok(tool, "expected fs_move tool to be registered");

    await tool.execute("call-3", {
      source: "/home/Fahmi/Desktop/Resume.docx",
      destination: "/home/Fahmi/Documents/Resume.docx",
      confirm: true,
    });

    assert.equal(capturedRequest.arguments.source, "desktop/Resume.docx");
    assert.equal(capturedRequest.arguments.destination, "documents/Resume.docx");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("quarantine tool rewrites guessed Linux home paths", async () => {
  process.env.OPENCLAW_GATEWAY_TOKEN = "token";

  const originalFetch = globalThis.fetch;
  let capturedRequest;
  globalThis.fetch = async (_url, init) => {
    capturedRequest = JSON.parse(init.body);
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            quarantined: true,
          },
        };
      },
    };
  };

  try {
    const tools = createHostControlTools({
      pluginConfig: {
        bridgeUrl: "http://host.docker.internal:48721",
        authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
        allowWriteOperations: true,
      },
      toolContext: {
        messageChannel: "telegram",
        sessionKey: "agent:main:telegram:direct:test",
        requesterSenderId: "1337",
      },
    });
    const tool = tools.find((entry) => entry.name === "host_control_fs_quarantine");
    assert.ok(tool, "expected fs_quarantine tool to be registered");

    await tool.execute("call-4", {
      path: "/home/Fahmi/Desktop/Resume.docx",
      confirm: true,
    });

    assert.equal(capturedRequest.operation, "fs.quarantine");
    assert.equal(capturedRequest.arguments.path, "desktop/Resume.docx");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("scaffold-only bridge tools are not exposed in the plugin surface", () => {
  const tools = createHostControlTools({
    pluginConfig: {
      bridgeUrl: "http://host.docker.internal:48721",
      authTokenEnv: "OPENCLAW_GATEWAY_TOKEN",
      allowExportOperations: true,
      allowBrowserInspect: true,
    },
    toolContext: {
      messageChannel: "telegram",
      sessionKey: "agent:main:telegram:direct:test",
      requesterSenderId: "1337",
    },
  });

  const names = new Set(tools.map((entry) => entry.name));
  assert.equal(names.has("host_control_browser_tab_inspect"), false);
  assert.equal(names.has("host_control_browser_tabs_list"), false);
  assert.equal(names.has("host_control_zip_for_export"), false);
});
