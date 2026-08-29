import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

/**
 * Serve one MCP request over Streamable HTTP (stateless JSON responses).
 * Fresh transport per call keeps concurrent inspector/curl clients isolated.
 */
export async function handleMcpRequest(
  request: Request,
  server: McpServer,
): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  await server.connect(transport)
  try {
    return await transport.handleRequest(request)
  } finally {
    await transport.close().catch(() => {})
    await server.close().catch(() => {})
  }
}
