#!/usr/bin/env node
import { parseArgs } from "node:util";
import {
  runBothServers,
  runHTTPStreamableServer,
  runSSEServer,
  runStdioServer,
} from "./server";
import { logger } from "./utils/logger";

// Parse command line arguments
const { values } = parseArgs({
  options: {
    transport: {
      type: "string",
      short: "t",
      default: "stdio",
    },
    host: {
      type: "string",
      short: "h",
      default: "localhost",
    },
    port: {
      type: "string",
      short: "p",
      default: "1122",
    },
    endpoint: {
      type: "string",
      short: "e",
      default: "", // We'll handle defaults per transport type
    },
    help: {
      type: "boolean",
      short: "H",
    },
  },
});

// Display help information if requested
if (values.help) {
  console.log(`
MCP Server Chart CLI

Options:
  --transport, -t  Specify the transport protocol: "stdio", "sse", "streamable", or "both" (default: "stdio")
  --host, -h       Specify the host for HTTP transports (default: localhost)
  --port, -p       Specify the port for HTTP transports (default: 1122)
  --endpoint, -e   Specify the endpoint for the transport:
                   - For SSE: default is "/sse"
                   - For streamable: default is "/mcp"
  --help, -H       Show this help message
  `);
  process.exit(0);
}

// Run in the specified transport mode
const transport = values.transport.toLowerCase();

if (transport === "sse") {
  logger.setIsStdio(false);
  const port = Number.parseInt(values.port as string, 10);
  // Use provided endpoint or default to "/sse" for SSE
  const endpoint = values.endpoint || "/sse";
  const host = values.host || "localhost";
  runSSEServer(host, port, endpoint).catch(console.error);
} else if (transport === "streamable") {
  logger.setIsStdio(false);
  const port = Number.parseInt(values.port as string, 10);
  // Use provided endpoint or default to "/mcp" for streamable
  const endpoint = values.endpoint || "/mcp";
  const host = values.host || "localhost";
  runHTTPStreamableServer(host, port, endpoint).catch(console.error);
} else if (transport === "both") {
  logger.setIsStdio(false);
  const port = Number.parseInt(values.port as string, 10);
  const host = values.host || "localhost";
  runBothServers(host, port).catch(console.error);
} else {
  logger.setIsStdio(true);
  runStdioServer().catch(console.error);
}
