import { ErrorResponses, LANGUAGES } from "$lib/constants.js";
import { getUser, updateUser } from "$lib/server/db/utils.js";

export const GET = async ({ params, locals }) => {
  if (locals.userId !== params.userid) {
    return ErrorResponses.forbidden();
  }

  const dbUser = await getUser(params.userid);
  if (dbUser) {
    delete dbUser.accessToken;
    // @ts-ignore | This is valid.
    delete dbUser.updatedAt;
    return Response.json(dbUser);
  }
  return ErrorResponses.notFound("User not found");
};

const ALLOWED_UPDATE_KEYS = ["language", "autoRedirect", "tips"];

export const PATCH = async ({ params, request, locals }) => {
  const data = await request.json();
  if (locals.userId !== data.id || locals.userId !== params.userid) {
    return ErrorResponses.forbidden();
  }
  // Filter out invalid keys
  for (const key in data) {
    if (!ALLOWED_UPDATE_KEYS.includes(key)) {
      delete data[key];
    }
  }

  // check if the values are valid
  if (
    !Object.values(LANGUAGES)
      .map((l) => l.value)
      .includes(data.language)
  ) {
    return ErrorResponses.badRequest("Invalid language");
  }
  if (typeof data.autoRedirect !== "boolean") {
    return ErrorResponses.badRequest("Invalid autoRedirect");
  }
  if (typeof data.tips !== "boolean") {
    return ErrorResponses.badRequest("Invalid tips");
  }

  await updateUser(params.userid, data);
  const updated = await getUser(params.userid);
  if (!updated) {
    return ErrorResponses.notFound("User not found");
  }

  return Response.json(updated);
};
