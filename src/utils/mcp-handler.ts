import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'

const MCP_RESPONSE_TIMEOUT_MS = 30_000

export async function handleMcpRequest(
  request: Request,
  server: McpServer,
): Promise<Response> {
  try {
    const jsonRpcRequest = (await request.json()) as JSONRPCMessage

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair()

    const responseData = await new Promise<JSONRPCMessage>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('MCP response timed out'))
      }, MCP_RESPONSE_TIMEOUT_MS)

      clientTransport.onmessage = (message: JSONRPCMessage) => {
        clearTimeout(timer)
        resolve(message)
      }

      void (async () => {
        try {
          await server.connect(serverTransport)
          await clientTransport.start()
          await serverTransport.start()
          await clientTransport.send(jsonRpcRequest)
        } catch (error) {
          clearTimeout(timer)
          reject(error)
        }
      })()
    })

    await clientTransport.close()
    await serverTransport.close()

    return Response.json(responseData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('MCP handler error:', error)

    return Response.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error instanceof Error ? error.message : String(error),
        },
        id: null,
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}
