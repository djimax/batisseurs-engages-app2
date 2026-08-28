import type { Request } from "express";
import type { Server as HttpServer, IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, WebSocket } from "ws";
import { sdk } from "./_core/sdk";

export const NOTIFICATION_WS_PATH = "/api/notifications/ws";

type NotificationPayload = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: number;
  actionUrl: string | null;
  eventKey: string | null;
  entityType: string | null;
  entityId: number | null;
  dedupeKey: string | null;
  createdAt: string;
};

type NotificationSocket = WebSocket & { userId?: number };

const clientsByUser = new Map<number, Set<NotificationSocket>>();
let socketServer: WebSocketServer | null = null;

function isAllowedOrigin(request: IncomingMessage) {
  const origin = request.headers.origin;
  if (!origin) return true;
  const host = request.headers.host;
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function removeClient(socket: NotificationSocket) {
  if (!socket.userId) return;
  const clients = clientsByUser.get(socket.userId);
  if (!clients) return;
  clients.delete(socket);
  if (clients.size === 0) clientsByUser.delete(socket.userId);
}

function rejectUpgrade(socket: Duplex, status = 401) {
  socket.write(`HTTP/1.1 ${status} Unauthorized\\r\\nConnection: close\\r\\n\\r\\n`);
  socket.destroy();
}

export function attachNotificationWebSocket(server: HttpServer) {
  if (socketServer) return;
  socketServer = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });

  server.on("upgrade", async (request, socket, head) => {
    let pathname = "";
    try {
      pathname = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`).pathname;
    } catch {
      rejectUpgrade(socket, 400);
      return;
    }
    if (pathname !== NOTIFICATION_WS_PATH) return;
    if (!isAllowedOrigin(request)) {
      rejectUpgrade(socket, 403);
      return;
    }

    try {
      const user = await sdk.authenticateRequest({ headers: request.headers } as Request);
      if (user.isCron || user.id <= 0) {
        rejectUpgrade(socket, 403);
        return;
      }

      socketServer?.handleUpgrade(request, socket, head, (client) => {
        const notificationSocket = client as NotificationSocket;
        notificationSocket.userId = user.id;
        const clients = clientsByUser.get(user.id) ?? new Set<NotificationSocket>();
        clients.add(notificationSocket);
        clientsByUser.set(user.id, clients);

        notificationSocket.on("close", () => removeClient(notificationSocket));
        notificationSocket.on("error", () => removeClient(notificationSocket));
        notificationSocket.on("message", (message) => {
          // The client may only use this channel as a liveness signal; it cannot
          // select a user, mark a notification, or invoke a privileged action.
          if (message.toString() === "ping" && notificationSocket.readyState === WebSocket.OPEN) {
            notificationSocket.send(JSON.stringify({ type: "pong" }));
          }
        });
        notificationSocket.send(JSON.stringify({ type: "ready", protocolVersion: 1 }));
      });
    } catch {
      rejectUpgrade(socket, 401);
    }
  });
}

export function publishNotification(notification: NotificationPayload) {
  const clients = clientsByUser.get(notification.userId);
  if (!clients) return 0;
  const payload = JSON.stringify({ type: "notification", notification });
  let delivered = 0;
  clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) {
      removeClient(client);
      return;
    }
    try {
      client.send(payload);
      delivered += 1;
    } catch {
      removeClient(client);
    }
  });
  return delivered;
}

export function getNotificationRealtimeStats() {
  let connections = 0;
  clientsByUser.forEach((clients) => { connections += clients.size; });
  return { users: clientsByUser.size, connections };
}
