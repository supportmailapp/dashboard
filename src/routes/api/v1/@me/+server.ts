import { ErrorResponses } from "$lib/constants";
import { fetchUserData } from "$lib/discord/utils";

export async function GET({ locals }) {
  if (!(locals.userId && locals.token)) return ErrorResponses.unauthorized();

  const user = await fetchUserData(locals.userId, locals.token);
  return Response.json(user, { status: 200, statusText: "OK" });
}
