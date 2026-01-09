import { env } from "$env/dynamic/private";
import jwt from "jsonwebtoken";

export const prerender = false;

export async function load({ locals, depends }) {
  depends("guild:layout");
  console.log("Loading +layout.server.ts");

  return {
    user: locals.user,
    wsToken: locals.user && env.WS_JWT_SECRET ? jwt.sign(locals.user, env.WS_JWT_SECRET) : undefined,
  };
}
