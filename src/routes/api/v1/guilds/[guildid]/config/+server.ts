import { JsonErrors, LANGUAGES } from "$lib/constants.js";
import { getDBGuild, updateDBGuild } from "$lib/server/db";

export async function GET({ locals }) {
  if (locals.guildId && locals.token) {
    const guild = await getDBGuild(locals.guildId, "language");
    if (!guild) {
      return Response.json("Not Found", { status: 404, statusText: "Not Found" });
    }

    return Response.json(guild, { status: 200, statusText: "OK" });
  }

  return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
}

// Currently, this endpoint only supports updating the language setting,
// since it's the only "global" setting that can be changed per guild.
export async function PATCH({ request, locals }) {
  if (!locals.guildId || !locals.token) {
    return JsonErrors.badRequest();
  }

  const body = await request.json();
  if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
    return JsonErrors.badRequest();
  }
  const guild = await getDBGuild(locals.guildId, "full");
  if (!guild) {
    return JsonErrors.notFound();
  }
  const { language } = body as Record<string, any>;
  if (!LANGUAGES.some((lang) => lang.value === language)) {
    return JsonErrors.badRequest("Invalid language");
  }

  try {
    const newGuild = await updateDBGuild(locals.guildId, {
      lang: language,
    });
    if (!newGuild) {
      return JsonErrors.serverError();
    }
    return Response.json(newGuild.toJSON({ flattenObjectIds: true }));
  } catch (err: any) {
    console.error("Error updating guild config:", err);
    return JsonErrors.serverError();
  }
}
