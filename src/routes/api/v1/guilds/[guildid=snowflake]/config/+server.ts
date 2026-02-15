import { JsonErrors, LANGUAGES, zodLanguage } from "$lib/constants.js";
import { FlattenDocToJSON, getDBGuild, updateDBGuild } from "$lib/server/db";
import { ZodValidator } from "$lib/server/validators/index.js";
import { json } from "@sveltejs/kit";
import z from "zod";

const patchSchema = z.object({
  language: zodLanguage.optional(),
});

export type PatchFields = z.infer<typeof patchSchema>;

export async function GET({ params }) {
  const guild = await getDBGuild(params.guildid, "language");
  if (!guild) {
    return JsonErrors.notFound();
  }

  return json(guild);
}

// Currently, this endpoint only supports updating the language setting,
// since it's the only "global" setting that can be changed per guild.
export async function PATCH({ request, locals, params }) {
  const body = await request.json();
  if (!body) {
    return JsonErrors.badRequest("Missing body?");
  }

  // Validation
  const validationRes = new ZodValidator(patchSchema).validate(body);

  if (!validationRes.success) {
    return JsonErrors.badRequest(validationRes.error.message);
  }

  const guild = await getDBGuild(params.guildid, "full");
  if (!guild) {
    return JsonErrors.notFound();
  }
  const { language } = body as PatchFields;
  if (!LANGUAGES.some((lang) => lang.value === language)) {
    return JsonErrors.badRequest("Invalid language");
  }

  try {
    const newGuild = await updateDBGuild(params.guildid, {
      lang: language,
    });
    if (!newGuild) {
      return JsonErrors.serverError();
    }

    return json({
      language: FlattenDocToJSON(newGuild).lang,
    });
  } catch (err: any) {
    console.error("Error updating guild config:", err);
    return JsonErrors.serverError();
  }
}
