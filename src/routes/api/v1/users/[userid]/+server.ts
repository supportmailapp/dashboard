import { fetchUserData } from "$lib/discord/oauth2.js";
import { getUser, updateUser } from "$lib/server/db/utils.js";
import { getUser as getCachedUser } from "$lib/cache/users.js";

export const GET = async ({ params }) => {
  const dbUser = await getUser(params.userid);
  if (dbUser) {
    delete dbUser.accessToken;
    delete dbUser.updatedAt;
    return Response.json(dbUser);
  }
  return new Response("User not found", { status: 404 });
};

const ALLOWED_UPDATE_KEYS = ["language", "autoRedirect", "t_left", "tips"];

export const PATCH = async ({ params, request, fetch }) => {
  const data = await request.json();
  // Filter out invalid keys
  for (const key in data) {
    if (!ALLOWED_UPDATE_KEYS.includes(key)) {
      delete data[key];
    }
  }

  await updateUser(params.userid, data);
  const updated = await getUser(params.userid);
  if (!updated) {
    return new Response("User not found", { status: 404 });
  }

  const cached = getCachedUser(params.userid);
  if (cached) {
    return Response.json({ ...updated, ...cached });
  }

  const user = await fetchUserData(params.userid, fetch, false);
  if (user) {
    return Response.json({ ...updated, ...user });
  }
};
