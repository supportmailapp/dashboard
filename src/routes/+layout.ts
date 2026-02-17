import { browser } from "$app/environment";
import { WS_ORIGIN } from "$lib/constants.js";
import { createWebSocketConnection } from "$lib/utils/websocket.js";

export async function load({ data }) {
  return {
    user: data.user,
    ws: data.wsToken && browser ? createWebSocketConnection(WS_ORIGIN, data.wsToken) : undefined,
    isVpn: data.isVpn,
  };
}
