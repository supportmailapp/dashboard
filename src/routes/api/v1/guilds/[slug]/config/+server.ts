import { checkUserGuildAccess } from "$lib/server/auth";

export const GET = async ({ params, cookies }) => {
  const guildId = params.slug;
  const token = cookies.get("session_token");

  if (guildId && token) {
    if (!(await checkUserGuildAccess(token, guildId))) {
      return Response.json(
        {
          message: "You do not have access to this guild",
        },
        { status: 403, statusText: "Forbidden" },
      );
    }
  }

  return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
};
