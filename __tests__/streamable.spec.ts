import { afterEach, describe, expect, it } from "vitest";
import { createStreamableHandler } from "../src/services/streamable";

const handlers: ReturnType<typeof createStreamableHandler>[] = [];

afterEach(async () => {
  await Promise.all(handlers.splice(0).map((handler) => handler.close()));
});

describe("Streamable HTTP protocol versions", () => {
  it("serves tools to a 2026-07-28 client", async () => {
    const handler = createStreamableHandler();
    handlers.push(handler);
    const response = await handler.fetch(
      new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "MCP-Protocol-Version": "2026-07-28",
          "Mcp-Method": "tools/list",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list",
          params: {
            _meta: {
              "io.modelcontextprotocol/protocolVersion": "2026-07-28",
              "io.modelcontextprotocol/clientInfo": {
                name: "test-client",
                version: "1.0.0",
              },
              "io.modelcontextprotocol/clientCapabilities": {},
            },
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.result.tools).toHaveLength(27);
  });

  it("still accepts a 2025-11-25 initialize request", async () => {
    const handler = createStreamableHandler();
    handlers.push(handler);
    const response = await handler.fetch(
      new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          "MCP-Protocol-Version": "2025-11-25",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" },
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.text();
    const body = JSON.parse(payload.split("data: ")[1]);
    expect(body.result.protocolVersion).toBe("2025-11-25");
  });
});
