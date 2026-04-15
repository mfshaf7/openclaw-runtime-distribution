import { createHostControlTools } from "./src/tools.mjs";

export default function register(api) {
  const tools = createHostControlTools(api);
  for (const tool of tools) {
    api.registerTool(tool);
  }
}
