import { type RequestHandler } from "@sveltejs/kit";

export const prerender = false;

export const GET: RequestHandler = async () => {
  return new Response("Heartbeat", { status: 200, statusText: "OK" });
};
