import crypto from "node:crypto";
import { callHostControlBridge } from "./bridge-client.mjs";
import { resolveHostControlConfig } from "./config.mjs";

function jsonResult(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    details: payload,
  };
}

function remapSharedPath(config, value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return raw;
  }
  const map = config.sharedPathMap;
  if (!map) {
    return raw;
  }
  if (raw === map.from || raw.startsWith(`${map.from}/`)) {
    return `${map.to}${raw.slice(map.from.length)}`;
  }
  return raw;
}

function mediaResult(config, payload) {
  const rawPaths = [];
  if (Array.isArray(payload?.paths)) {
    for (const value of payload.paths) {
      if (typeof value === "string" && value.trim()) {
        rawPaths.push(value);
      }
    }
  }
  if (Array.isArray(payload?.displays)) {
    for (const display of payload.displays) {
      if (typeof display?.path === "string" && display.path.trim()) {
        rawPaths.push(display.path);
      }
    }
  }
  if (typeof payload?.path === "string" && payload.path.trim()) {
    rawPaths.unshift(payload.path);
  }
  const mediaPaths = [...new Set(rawPaths.map((value) => remapSharedPath(config, value)).filter(Boolean))];
  if (mediaPaths.length === 0) {
    return jsonResult(payload);
  }
  const details = {
    ...payload,
    path: mediaPaths[0],
    ...(mediaPaths.length > 1 ? { paths: mediaPaths } : {}),
    ...(Array.isArray(payload?.displays)
      ? {
          displays: payload.displays.map((display, index) => ({
            ...display,
            path: remapSharedPath(config, display?.path),
          })),
        }
      : {}),
  };
  return {
    content: mediaPaths.map((mediaPath) => ({ type: "text", text: `MEDIA:${mediaPath}` })),
    details,
  };
}

function operationSchema(extra = {}) {
  return {
    type: "object",
    additionalProperties: false,
    properties: extra,
  };
}

function buildPayload(api, operation, argumentsValue) {
  return {
    request_id: crypto.randomUUID(),
    operation,
    arguments: argumentsValue,
    actor: {
      channel: api.toolContext?.messageChannel ?? null,
      session_key: api.toolContext?.sessionKey ?? null,
      sender_id: api.toolContext?.requesterSenderId ?? null,
    },
  };
}

function denyByPolicy(message) {
  const error = new Error(message);
  error.code = "policy_denied";
  throw error;
}

function requireConfirmedAction(params, actionLabel) {
  if (params?.confirm !== true) {
    denyByPolicy(`${actionLabel} requires confirm=true`);
  }
}

function isTelegramDeliveryContext(api) {
  return (
    api?.toolContext?.messageChannel === "telegram" &&
    typeof api?.toolContext?.requesterSenderId === "string" &&
    api.toolContext.requesterSenderId.trim().length > 0
  );
}

function shouldBypassExplicitConfirm(api, definition) {
  if (!definition?.bypassConfirmInTelegramDelivery) {
    return false;
  }
  return isTelegramDeliveryContext(api);
}

function normalizeGuessedHomeAlias(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return value;
  }
  const match = /^\/home\/[^/]+\/(Desktop|Downloads|Documents)(?:\/(.*))?$/i.exec(raw);
  if (!match) {
    return value;
  }
  const alias = match[1].toLowerCase();
  const remainder = match[2]?.trim().replace(/^\/+|\/+$/g, "");
  return remainder ? `${alias}/${remainder}` : alias;
}

function normalizeGuessedWindowsProfileAlias(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return value;
  }
  const match = /^[a-zA-Z]:\\Users\\[^\\]+\\(Desktop|Downloads|Documents)(?:\\(.*))?$/i.exec(raw);
  if (!match) {
    return value;
  }
  const alias = match[1].toLowerCase();
  const remainder = match[2]?.trim().replace(/^[\\/]+|[\\/]+$/g, "").replace(/[\\]+/g, "/");
  return remainder ? `${alias}/${remainder}` : alias;
}

function normalizeGuessedWslProfileAlias(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return value;
  }
  const match = /^\/mnt\/[a-z]\/Users\/[^/]+(?:\/OneDrive)?\/(Desktop|Downloads|Documents)(?:\/(.*))?$/i.exec(raw);
  if (!match) {
    return value;
  }
  const alias = match[1].toLowerCase();
  const remainder = match[2]?.trim().replace(/^\/+|\/+$/g, "");
  return remainder ? `${alias}/${remainder}` : alias;
}

function normalizeHomeShortcutAlias(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return value;
  }
  const match = /^~\/(Desktop|Downloads|Documents)(?:\/(.*))?$/i.exec(raw);
  if (!match) {
    return value;
  }
  const alias = match[1].toLowerCase();
  const remainder = match[2]?.trim().replace(/^\/+|\/+$/g, "");
  return remainder ? `${alias}/${remainder}` : alias;
}

function normalizeHostArgumentValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeHostArgumentValue(entry));
  }
  if (typeof value === "string") {
    return normalizeHomeShortcutAlias(
      normalizeGuessedWslProfileAlias(
        normalizeGuessedWindowsProfileAlias(normalizeGuessedHomeAlias(value)),
      ),
    );
  }
  return value;
}

function normalizeHostArguments(payload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, normalizeHostArgumentValue(value)]),
  );
}

function createReadTool(api, definition) {
  return {
    name: definition.name,
    label: definition.label,
    description: definition.description,
    parameters: definition.parameters,
    async execute(_id, params) {
      const config = resolveHostControlConfig(api);
      const payload = buildPayload(
        api,
        definition.operation,
        normalizeHostArguments(definition.mapParams(params)),
      );
      const result = await callHostControlBridge(config, payload);
      return jsonResult(result.result);
    },
  };
}

function createAllowedRootsSearchTool(api) {
  return {
    name: "host_control_find_in_allowed_roots",
    label: "Host Control Find In Allowed Roots",
    description:
      "Search across the host roots currently allowed by bridge policy. Use this for generic host file finding instead of broad roots like /, ~/Desktop, or /mnt/c/Users/<name>.",
    parameters: operationSchema({
      pattern: { type: "string", description: "Filename pattern, e.g. *.docx or *resume*.*." },
      limit: { type: "number", description: "Maximum total results across allowed roots." },
    }),
    async execute(_id, params) {
      const config = resolveHostControlConfig(api);
      const pattern = params?.pattern;
      const limit = Math.max(1, Number(params?.limit || 20));
      const rootsPayload = buildPayload(api, "config.allowed_roots.list", {});
      const rootsResult = await callHostControlBridge(config, rootsPayload);
      const allowedRoots = Array.isArray(rootsResult?.result?.roots)
        ? rootsResult.result.roots.filter((entry) => typeof entry === "string" && entry.trim())
        : [];
      if (allowedRoots.length === 0) {
        denyByPolicy("No allowed roots are currently available from the OpenClaw host bridge");
      }
      const results = [];
      for (const root of allowedRoots) {
        if (results.length >= limit) {
          break;
        }
        const payload = buildPayload(api, "fs.search", {
          root,
          pattern,
          limit: limit - results.length,
        });
        const result = await callHostControlBridge(config, payload);
        const entries = Array.isArray(result?.result?.results) ? result.result.results : [];
        for (const entry of entries) {
          results.push({ ...entry, matched_root: root });
          if (results.length >= limit) {
            break;
          }
        }
      }
      return jsonResult({
        roots: allowedRoots,
        pattern: String(pattern || "*"),
        results,
      });
    },
  };
}

function createWriteTool(api, definition) {
  return {
    name: definition.name,
    label: definition.label,
    description: definition.description,
    parameters: definition.parameters,
    async execute(_id, params) {
      const config = resolveHostControlConfig(api);
      if (!config.allowWriteOperations) {
        denyByPolicy("Write operations are disabled in host-control plugin config");
      }
      requireConfirmedAction(params, definition.label);
      const payload = buildPayload(
        api,
        definition.operation,
        normalizeHostArguments(definition.mapParams(params)),
      );
      const result = await callHostControlBridge(config, payload);
      return jsonResult(result.result);
    },
  };
}

function createExportTool(api, definition) {
  return {
    name: definition.name,
    label: definition.label,
    description: definition.description,
    parameters: definition.parameters,
    async execute(_id, params) {
      const config = resolveHostControlConfig(api);
      if (!config.allowExportOperations) {
        denyByPolicy("Export operations are disabled in host-control plugin config");
      }
      if (!shouldBypassExplicitConfirm(api, definition)) {
        requireConfirmedAction(params, definition.label);
      }
      const payload = buildPayload(
        api,
        definition.operation,
        normalizeHostArguments(definition.mapParams(params)),
      );
      const result = await callHostControlBridge(config, payload);
      return mediaResult(config, result.result);
    },
  };
}

function createAdminTool(api, definition) {
  return {
    name: definition.name,
    label: definition.label,
    description: definition.description,
    parameters: definition.parameters,
    async execute(_id, params) {
      const config = resolveHostControlConfig(api);
      if (!config.allowAdminOperations) {
        denyByPolicy("Admin operations are disabled in host-control plugin config");
      }
      requireConfirmedAction(params, definition.label);
      const payload = buildPayload(
        api,
        definition.operation,
        normalizeHostArguments(definition.mapParams(params)),
      );
      const result = await callHostControlBridge(config, payload);
      return jsonResult(result.result);
    },
  };
}

export function createHostControlTools(api) {
  const pluginConfig = api.pluginConfig ?? {};
  const allowWriteOperations = pluginConfig.allowWriteOperations === true;
  const allowAdminOperations = pluginConfig.allowAdminOperations === true;
  const allowExportOperations = pluginConfig.allowExportOperations === true;
  const tools = [
    createReadTool(api, {
      name: "host_control_health_check",
      label: "Host Control Health Check",
      description: "Run a read-only health summary against the OpenClaw host bridge.",
      operation: "health.check",
      parameters: operationSchema(),
      mapParams: () => ({}),
    }),
    createReadTool(api, {
      name: "host_control_fs_list",
      label: "Host Control List Files",
      description: "List direct children of an allowed host-PC directory through the OpenClaw host bridge. Prefer this over exec for desktop, downloads, and documents.",
      operation: "fs.list",
      parameters: operationSchema({
        path: { type: "string", description: "Allowed root or relative path to list." },
      }),
      mapParams: (params) => ({ path: params.path }),
    }),
    createReadTool(api, {
      name: "host_control_list_host_folder",
      label: "Host Control List Host Folder",
      description: "Primary tool for listing a host-PC folder inside allowed roots. Use this instead of exec for desktop, downloads, and documents.",
      operation: "fs.list",
      parameters: operationSchema({
        path: {
          type: "string",
          description:
            "Allowed host folder alias or one exact verified relative path to list. Prefer exact child names learned from previous tool output, for example desktop/PERSONAL JOB DATA. Do not escape spaces with backslashes or invent rewritten path segments.",
        },
      }),
      mapParams: (params) => ({ path: params.path }),
    }),
    createReadTool(api, {
      name: "host_control_fs_search",
      label: "Host Control Search Files",
      description: "Search files under an allowed host-PC root through the OpenClaw host bridge. Prefer this over exec for host file finding.",
      operation: "fs.search",
      parameters: operationSchema({
        root: { type: "string", description: "Allowed root or relative path." },
        pattern: { type: "string", description: "Glob-like filename pattern, e.g. *.pdf." },
        limit: { type: "number", description: "Maximum results." },
      }),
      mapParams: (params) => ({ root: params.root, pattern: params.pattern, limit: params.limit }),
    }),
    createReadTool(api, {
      name: "host_control_find_host_files",
      label: "Host Control Find Host Files",
      description:
        "Primary tool for finding files on the host PC inside one known allowed root. The root must be a single host alias like desktop, documents, or downloads, or one verified relative subpath. Do not pass ~ paths, Windows profile guesses, or multiple roots joined together; use host_control_find_in_allowed_roots when the user did not name one specific root.",
      operation: "fs.search",
      parameters: operationSchema({
        root: {
          type: "string",
          description:
            "One allowed host root alias or one exact verified relative path. Examples: desktop, documents, downloads, desktop/PERSONAL JOB DATA. Not valid: ~/Documents, documents;downloads, or guessed rewrites like personal\\job data.",
        },
        pattern: { type: "string", description: "Filename pattern, e.g. *.docx or *resume*.*." },
        limit: { type: "number", description: "Maximum results." },
      }),
      mapParams: (params) => ({ root: params.root, pattern: params.pattern, limit: params.limit }),
    }),
    createAllowedRootsSearchTool(api),
    createReadTool(api, {
      name: "host_control_fs_read_meta",
      label: "Host Control Read Metadata",
      description: "Read file or directory metadata through the OpenClaw host bridge.",
      operation: "fs.read_meta",
      parameters: operationSchema({
        path: { type: "string", description: "Path inside allowed roots." },
      }),
      mapParams: (params) => ({ path: params.path }),
    }),
  ];

  if (allowWriteOperations) {
    tools.push(
      createWriteTool(api, {
      name: "host_control_fs_mkdir",
      label: "Host Control Make Directory",
      description: "Create a directory inside allowed roots through the OpenClaw host bridge.",
      operation: "fs.mkdir",
      parameters: operationSchema({
        path: { type: "string", description: "Directory path inside allowed roots." },
        confirm: { type: "boolean", description: "Must be true for mutating actions." },
      }),
      mapParams: (params) => ({ path: params.path }),
    }),
      createWriteTool(api, {
      name: "host_control_fs_move",
      label: "Host Control Move Path",
      description: "Move a file or folder inside allowed roots through the OpenClaw host bridge.",
      operation: "fs.move",
      parameters: operationSchema({
        source: { type: "string", description: "Source path inside allowed roots." },
        destination: { type: "string", description: "Destination path inside allowed roots." },
        confirm: { type: "boolean", description: "Must be true for mutating actions." },
      }),
      mapParams: (params) => ({ source: params.source, destination: params.destination }),
    }),
      createWriteTool(api, {
      name: "host_control_fs_quarantine",
      label: "Host Control Quarantine Path",
      description:
        "Move a file or folder out of the visible working area into the managed host-control quarantine directory. Use this instead of delete when the goal is to clean up a folder view without permanent removal.",
      operation: "fs.quarantine",
      parameters: operationSchema({
        path: { type: "string", description: "Source path inside allowed roots." },
        confirm: { type: "boolean", description: "Must be true for mutating actions." },
      }),
      mapParams: (params) => ({ path: params.path }),
    }),
    );
  }

  if (allowAdminOperations) {
    tools.push(
      createAdminTool(api, {
        name: "host_control_turn_off_monitors",
        label: "Host Control Turn Off Monitors",
        description: "Turn the host monitor(s) off.",
        operation: "display.monitor_power",
        parameters: operationSchema({
          confirm: { type: "boolean", description: "Must be true for admin actions." },
        }),
        mapParams: () => ({ action: "off" }),
      }),
      createAdminTool(api, {
        name: "host_control_turn_on_monitors",
        label: "Host Control Turn On Monitors",
        description: "Turn the host monitor(s) back on.",
        operation: "display.monitor_power",
        parameters: operationSchema({
          confirm: { type: "boolean", description: "Must be true for admin actions." },
        }),
        mapParams: () => ({ action: "on" }),
      }),
    );
  }

  if (allowExportOperations) {
    tools.push(
      createExportTool(api, {
      name: "host_control_stage_for_telegram",
      label: "Host Control Stage For Telegram",
      description: "Stage a host-PC file for Telegram delivery. Use this only when the user explicitly asks to stage or prepare a file for later Telegram delivery. Do not use this for direct 'send it to me' requests when host_control_send_file_to_telegram fits.",
      operation: "fs.stage_for_telegram",
      bypassConfirmInTelegramDelivery: true,
      parameters: operationSchema({
        path: { type: "string", description: "Path to stage." },
        confirm: { type: "boolean", description: "Must be true for export actions." },
      }),
      mapParams: (params) => ({ path: params.path }),
    }),
      createExportTool(api, {
      name: "host_control_send_file_to_telegram",
      label: "Host Control Send File To Telegram",
      description: "Primary tool for sending a host-PC file to the user in Telegram. Use this after the exact host file is identified for any direct 'send', 'send it to me', or 'resend it' request. Do not use host_control_stage_for_telegram when the user is asking for immediate delivery.",
      operation: "fs.stage_for_telegram",
      bypassConfirmInTelegramDelivery: true,
      parameters: operationSchema({
        path: { type: "string", description: "Exact host-PC file path or host alias path to send." },
        confirm: { type: "boolean", description: "Must be true for Telegram file delivery." },
      }),
      mapParams: (params) => ({ path: params.path }),
    }),
      createExportTool(api, {
      name: "host_control_capture_desktop_screenshot",
      label: "Host Control Capture Desktop Screenshot",
      description: "Capture the current host-PC desktop as a screenshot and send it back through Telegram. Use this for desktop screenshot requests instead of browser tab tools.",
      operation: "display.screenshot",
      parameters: operationSchema({
        confirm: { type: "boolean", description: "Must be true for screenshot capture." },
      }),
      mapParams: () => ({ file_name: "desktop-screenshot.png" }),
    }),
      createExportTool(api, {
      name: "host_control_send_desktop_screenshot_to_telegram",
      label: "Host Control Send Desktop Screenshot To Telegram",
      description: "Primary tool for 'send me a screenshot of my desktop' requests. Capture the current host-PC desktop and return it directly to Telegram. Do not replace this with manual screenshot instructions when available.",
      operation: "display.screenshot",
      bypassConfirmInTelegramDelivery: true,
      parameters: operationSchema({
        confirm: { type: "boolean", description: "Must be true for desktop screenshot capture." },
      }),
      mapParams: () => ({ file_name: "desktop-screenshot.png" }),
    }),
    );
  }

  return tools;
}
