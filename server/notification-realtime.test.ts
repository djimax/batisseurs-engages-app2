import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const realtimeSource = readFileSync(new URL("./notification-realtime.ts", import.meta.url), "utf8");
const hookSource = readFileSync(new URL("../client/src/hooks/useNotificationRealtime.ts", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../client/src/pages/Notifications.tsx", import.meta.url), "utf8");
const centerSource = readFileSync(new URL("./notification-center.ts", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("./_core/index.ts", import.meta.url), "utf8");

describe("Notification realtime contract", () => {
  it("authenticates the websocket handshake and isolates connections by server-derived user", () => {
    expect(realtimeSource).toContain('export const NOTIFICATION_WS_PATH = "/api/notifications/ws"');
    expect(realtimeSource).toContain("sdk.authenticateRequest");
    expect(realtimeSource).toContain("clientsByUser.get(user.id)");
    expect(realtimeSource).toContain("user.isCron || user.id <= 0");
    expect(realtimeSource).toContain("isAllowedOrigin");
    expect(realtimeSource).toContain("The client may only use this channel as a liveness signal");
  });

  it("publishes only persisted notifications and removes dead sockets", () => {
    expect(centerSource).toContain("publishNotification({ ...notification, isRead: notification.isRead ?? 0 })");
    expect(indexSource).toContain("attachNotificationWebSocket(server)");
    expect(realtimeSource).toContain("publishNotification");
    expect(realtimeSource).toContain("client.readyState !== WebSocket.OPEN");
    expect(realtimeSource).toContain("removeClient(client)");
    expect(realtimeSource).toContain('type: "notification"');
  });

  it("reconnects with a bounded delay and falls back to tRPC polling", () => {
    expect(hookSource).toContain("MAX_RECONNECT_DELAY_MS");
    expect(hookSource).toContain("POLLING_INTERVAL_MS");
    expect(hookSource).toContain("startPolling");
    expect(hookSource).toContain('setStatus("polling")');
    expect(hookSource).toContain("utils.notifications.list.invalidate()");
    expect(hookSource).toContain("current.notifications.some((item) => item.id === notification.id)");
  });

  it("exposes the transport state to the notification page", () => {
    expect(pageSource).toContain("useNotificationRealtime");
    expect(pageSource).toContain("Temps réel actif");
    expect(pageSource).toContain("Synchronisation de secours");
  });
});
