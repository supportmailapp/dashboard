import { SchemaValidator, type ConfigOverview } from "$lib";
import { SupportedLanguages } from "$lib/constants.js";
import { getGuild, updateGuild } from "$lib/server/db";
import type { IDBGuild } from "supportmail-types";

export const GET = async ({ locals }) => {
  let config: IDBGuild | any | null = null;
  if (locals.guildId && locals.token) {
    if (!config) {
      const guild = await getGuild(locals.guildId);
      if (!guild) {
        return Response.json("Not Found", { status: 404, statusText: "Not Found" });
      }

      config = guild;
    }

    return Response.json(config, { status: 200, statusText: "OK" });
  }

  return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
};

const baseConfigSchema = new SchemaValidator<Omit<ConfigOverview, "_id" | "ticketForum" | "alertChannel">>({
  id: { type: "string", required: true },
  icon: { type: ["string", "null"], required: true },
  name: { type: "string", required: true },
  lang: { type: "string", required: true, enum: SupportedLanguages.map((lang) => lang.value) },
});

export const PATCH = async ({ locals, request }) => {
  console.log("PATCH /api/v1/config/[guildid]/+server");
  if (locals.guildId && locals.token) {
    const update = (await request.json()) as Record<string, any>;
    const result = baseConfigSchema.validate(update);
    if (!result.isValid || Object.keys(result.value).length > 0) {
      console.debug("Validation errors", result.errors);
      return Response.json(result, { status: 400, statusText: "Bad Request" });
    }

    await updateGuild(locals.guildId, {
      $set: {
        ...result.value,
      },
    });

    return new Response(null, { status: 204, statusText: "OK" });
  }

  return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
};
