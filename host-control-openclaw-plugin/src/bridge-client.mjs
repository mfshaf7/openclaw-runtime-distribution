export async function callHostControlBridge(config, payload) {
  if (!config.enabled) {
    throw new Error("host-control plugin is disabled");
  }
  if (!config.authToken) {
    throw new Error(`Missing bridge auth token env: ${config.authTokenEnv}`);
  }
  const controller = new AbortController();
  const timeoutMs = config.operationTimeoutsMs?.[payload.operation] ?? config.timeoutMs;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${config.bridgeUrl}/v1/bridge`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.authToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json?.ok !== true) {
      const message = json?.error?.message || `Bridge request failed with status ${response.status}`;
      const error = new Error(message);
      error.code = json?.error?.code || "bridge_error";
      throw error;
    }
    return json;
  } finally {
    clearTimeout(timeout);
  }
}
