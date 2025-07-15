import { JsonErrors, LANGUAGES, zodLanguage } from "$lib/constants.js";
import { FlattenDocToJSON, getDBGuild, updateDBGuild } from "$lib/server/db";
import { MyValidator } from "$lib/server/validators/index.js";
import z from "zod";

const patchSchema = z.object({
  language: zodLanguage,
});

export async function GET({ locals }) {
  if (locals.guildId && locals.token) {
    const guild = await getDBGuild(locals.guildId, "language");
    if (!guild) {
      return JsonErrors.notFound();
    }

    return Response.json(guild, { status: 200, statusText: "OK" });
  }

  return JsonErrors.badRequest();
}

// Currently, this endpoint only supports updating the language setting,
// since it's the only "global" setting that can be changed per guild.
export async function PATCH({ request, locals }) {
  if (!locals.guildId || !locals.token) {
    return JsonErrors.badRequest();
  }

  const body = await request.json();
  if (!body) {
    return JsonErrors.badRequest("Missing body?");
  }

  // Validation
  const validationRes = new MyValidator(patchSchema).validate(body);

  if (!validationRes.success) {
    return JsonErrors.badRequest(validationRes.error.message);
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

    return Response.json({
      language: FlattenDocToJSON(newGuild).lang,
    });
  } catch (err: any) {
    console.error("Error updating guild config:", err);
    return JsonErrors.serverError();
  }
}
