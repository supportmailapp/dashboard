import { ErrorResponses } from "$lib/constants";
import { fetchDBUser } from "$lib/server/auth.js";

export async function GET({ locals }) {
  if (!(locals.userId && locals.token)) return ErrorResponses.unauthorized();

  const user = await fetchDBUser(locals.userId);
  return Response.json(user, { status: 200, statusText: "OK" });
}
