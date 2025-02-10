import { verifySessionToken } from "$lib/server/auth";
import { ErrorJsonResponse } from "$lib/server/constants";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ cookies }) => {
  const token = cookies.get("session_token");
  if (!token) {
    return ErrorJsonResponse(400, "Bad Request", "Missing session token");
  } else if (!(await verifySessionToken(token))) {
    return ErrorJsonResponse(401, "Unauthorized", "Invalid session token");
  }

  return Response.json([], { status: 200, statusText: "OK" });
};
