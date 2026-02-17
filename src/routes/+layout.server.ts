import { env } from "$env/dynamic/private";
import jwt from "jsonwebtoken";

export const prerender = false;

export async function load({ locals, depends }) {
  depends("root:layout");

  return {
    user: locals.user,
    wsToken: locals.user && env.WS_JWT_SECRET ? jwt.sign(locals.user, env.WS_JWT_SECRET) : undefined,
    isVpn: locals.isVpn,
  };
}
