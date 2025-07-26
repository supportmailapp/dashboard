import type { APIUser } from "discord-api-types/v10";
import { io, Socket } from "socket.io-client";

type WsResponseSuccess<T> = {
  success: true;
  data: T;
  error?: undefined;
};

type WsResponseError = {
  success: false;
  data?: undefined;
  error: unknown;
};

export type WsResponseType<T> = WsResponseSuccess<T> | WsResponseError;
export type WsEventType = keyof EventsMap;

export type EventsMap = {
  test: (data: any, callback: (response: WsResponseType<any>) => void) => void;
  "get-guild-users": (
    data: { userIds?: string[]; guildId: string; filters?: { bot?: boolean } },
    callback: (response: WsResponseType<APIUser[]>) => void,
  ) => void;
  "get-mention-users": (
    data: { userIds: string[]; filters?: { bot?: boolean } },
    callback: (response: WsResponseType<any>) => void,
  ) => void;
};

export function createWebSocketConnection(url: string, token: string) {
  const socket: Socket<EventsMap> = io(url, {
    auth: {
      token,
    },
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20_000,
  });

  socket.on("connect_error", (err) => {
    console.error("WebSocket connection error:", err);
  });

  socket.on("disconnect", (reason) => {
    console.warn("WebSocket disconnected:", reason);
  });

  socket.on("connect", () => {
    console.log("WebSocket connected successfully");
  });

  return socket;
}
