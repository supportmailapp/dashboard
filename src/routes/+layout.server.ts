import { env } from "$env/dynamic/private";
import jwt from "jsonwebtoken";

export const prerender = false;

export async function load({ locals }) {
  console.log("Loading +layout.server.ts");
  console.log("User:", locals.user);
  return {
    user: locals.user,
    wsToken: locals.user ? jwt.sign(locals.user, env.WS_JWT_SECRET) : undefined,
  };
}
