import { browser } from "$app/environment";
import { env } from "$env/dynamic/public";
import { createWebSocketConnection } from "$lib/utils/websocket.js";

export async function load({ data }) {
  return {
    user: data.user,
    ws: data.wsToken && browser ? createWebSocketConnection(env.PUBLIC_WS_URL, data.wsToken) : undefined,
  };
}
