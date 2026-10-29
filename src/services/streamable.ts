import { toNodeHandler } from "@modelcontextprotocol/node";
import {
  createMcpHandler,
  McpServer,
  type CallToolResult,
} from "@modelcontextprotocol/server";
import cors from "cors";
import express, { type Express } from "express";
import { z } from "zod";
import * as Charts from "../charts";
import { callTool } from "../utils/callTool";
import { getDisabledTools } from "../utils/env";
import { logger } from "../utils/logger";

export const startHTTPStreamableServer = async (
  endpoint = "/mcp",
  port = 1122,
  host = "localhost",
): Promise<void> => {
  const app = express();
  app.use(cors({ origin: "*", exposedHeaders: ["Mcp-Session-Id"] }));

  registerStreamableEndpoint(app, endpoint);

  app.listen(port, host, () => {
    logger.success(
      `Streamable HTTP Server listening on http://${host}:${port}${endpoint}`,
    );
  });
};

function createStreamableServer(): McpServer {
  const server = new McpServer({ name: "mcp-server-chart", version: "0.9.11" });
  const disabledTools = getDisabledTools();

  for (const chart of Object.values(Charts)) {
    if (disabledTools.includes(chart.tool.name)) continue;

    server.registerTool(
      chart.tool.name,
      {
        description: chart.tool.description,
        inputSchema: z.object(chart.schema),
        annotations: chart.tool.annotations,
      },
      async (args) => (await callTool(chart.tool.name, args)) as CallToolResult,
    );
  }

  return server;
}

export function createStreamableHandler() {
  return createMcpHandler(createStreamableServer);
}

export function registerStreamableEndpoint(
  app: Express,
  endpoint = "/mcp",
): void {
  // Mount before express.json(): the Node adapter reads the raw request body.
  const handler = toNodeHandler(createStreamableHandler());
  app.all(endpoint, (req, res) => {
    void handler(req, res).catch((error) => {
      logger.error("HTTP Streamable Server response error", error);
      if (!res.headersSent) res.status(500).end();
    });
  });
}
