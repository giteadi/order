/**
 * SSE (Server-Sent Events) Service
 * Manages client connections and broadcasts order status updates
 * 
 * Connection key: sessionId (from URL query param)
 * Each browser tab connects with its sessionId and receives events for its orders
 */

const clients = new Map() // sessionId -> Set<res>

/**
 * Register a new SSE client
 * @param {string} sessionId
 * @param {object} res - Express response object
 */
export function addClient(sessionId, res) {
  if (!clients.has(sessionId)) {
    clients.set(sessionId, new Set())
  }
  clients.get(sessionId).add(res)
}

/**
 * Remove a client when connection closes
 */
export function removeClient(sessionId, res) {
  const set = clients.get(sessionId)
  if (set) {
    set.delete(res)
    if (set.size === 0) clients.delete(sessionId)
  }
}

/**
 * Broadcast an order status event to all clients with matching sessionId
 * @param {string} sessionId
 * @param {object} payload - { orderId, status, tableNumber }
 */
export function broadcastOrderStatus(sessionId, payload) {
  const set = clients.get(sessionId)
  if (!set || set.size === 0) return

  const data = JSON.stringify(payload)
  for (const res of set) {
    try {
      res.write(`event: order_status\ndata: ${data}\n\n`)
    } catch (e) {
      // Client disconnected mid-write — remove it
      set.delete(res)
    }
  }
}

/**
 * Total active connections (for health/debug)
 */
export function getClientCount() {
  let total = 0
  for (const set of clients.values()) total += set.size
  return total
}
