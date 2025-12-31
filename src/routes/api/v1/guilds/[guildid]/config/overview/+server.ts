import { JsonErrors } from "$lib/constants.js";
import { DBGuild } from "$lib/server/db";
import { ZodValidator } from "$lib/server/validators/index.js";
import { overview } from "$v1Api/assertions";
import { json } from "@sveltejs/kit";

const validator = new ZodValidator(overview);

export async function GET({ params }) {
  const cfg = await DBGuild.findOne({ id: params.guildid });

  return json({
    language: cfg?.lang || "en",
  });
}

export async function PUT({ request, params }) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return JsonErrors.badRequest("Invalid JSON");
  }

  const parsed = validator.validate(body);
  if (!parsed.success) {
    return JsonErrors.badRequest(ZodValidator.toHumanError(parsed.error));
  }

  const cfg = await DBGuild.findOneAndUpdate(
    { id: params.guildid },
    {
      lang: parsed.data.language,
    },
    { new: true },
  );

  return json({
    language: cfg?.lang || "en",
  });
}
