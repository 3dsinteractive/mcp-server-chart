import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import cors from "cors";
import express from "express";
import { logger } from "../utils/logger";
import { registerSSEEndpoints } from "./sse";
import { registerStreamableEndpoint } from "./streamable";

export async function startBothMcpServers(
  createServer: () => Server,
  port = 1122,
  host = "localhost",
): Promise<void> {
  const app = express();
  app.use(cors({ origin: "*", exposedHeaders: ["Mcp-Session-Id"] }));

  registerStreamableEndpoint(app);
  app.use(express.json());
  registerSSEEndpoints(app, createServer);

  app.listen(port, host, () => {
    logger.success(`SSE Server listening on http://${host}:${port}/sse`);
    logger.success(
      `Streamable HTTP Server listening on http://${host}:${port}/mcp`,
    );
  });
}
