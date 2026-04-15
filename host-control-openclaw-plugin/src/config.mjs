function toBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function toTrimmedString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function toNumber(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toSharedPathMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const from = typeof value.from === "string" ? value.from.trim().replace(/\/+$/, "") : "";
  const to = typeof value.to === "string" ? value.to.trim().replace(/\/+$/, "") : "";
  if (!from || !to) {
    return null;
  }
  return { from, to };
}

function toOperationTimeouts(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const output = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "number" && Number.isFinite(entry) && entry > 0) {
      output[key] = entry;
    }
  }
  return output;
}

export function resolveHostControlConfig(api) {
  const cfg = api.pluginConfig ?? {};
  const bridgeUrl =
    toTrimmedString(cfg.bridgeUrl) ||
    toTrimmedString(process.env.OPENCLAW_HOST_BRIDGE_URL) ||
    "";
  const authTokenEnv = toTrimmedString(cfg.authTokenEnv, "OPENCLAW_HOST_BRIDGE_TOKEN");
  const authToken = toTrimmedString(process.env[authTokenEnv]);
  if (!bridgeUrl) {
    throw new Error("host-control requires plugin config.bridgeUrl or OPENCLAW_HOST_BRIDGE_URL");
  }
  return {
    enabled: toBoolean(cfg.enabled, true),
    bridgeUrl: bridgeUrl.replace(/\/+$/, ""),
    authTokenEnv,
    authToken,
    timeoutMs: toNumber(cfg.timeoutMs, 10_000),
    operationTimeoutsMs: {
      "fs.search": 25_000,
      "fs.stage_for_telegram": 20_000,
      ...toOperationTimeouts(cfg.operationTimeoutsMs),
    },
    sharedPathMap: toSharedPathMap(cfg.sharedPathMap),
    allowWriteOperations: toBoolean(cfg.allowWriteOperations, false),
    allowExportOperations: toBoolean(cfg.allowExportOperations, false),
    allowBrowserInspect: toBoolean(cfg.allowBrowserInspect, false),
  };
}
