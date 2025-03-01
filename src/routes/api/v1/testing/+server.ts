import { verifySessionToken } from "$lib/server/auth";

export const POST = async ({ request }) => {
  const body = await request.json();
  const res = verifySessionToken(body.token);
  if (!res) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  return Response.json(res, { status: 200, statusText: "OK" });
};
