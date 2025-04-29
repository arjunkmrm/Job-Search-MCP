import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./server-logic.js";

try {
  const transport = new StdioServerTransport();
  await server.connect(transport);
} catch (error) {
  console.error("Server startup failed:", error);
  process.exit(1);
}
