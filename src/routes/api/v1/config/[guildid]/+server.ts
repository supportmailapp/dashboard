import type { ConfigOverview } from "$lib";
import { ObjectValidator, PropertyValidator, StringValidator, UnionValidator } from "$lib";
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

const baseConfigValidator = new ObjectValidator<Omit<ConfigOverview, "ticketForum" | "alertChannel">>()
  .addValidator("id", StringValidator)
  .addValidator("name", StringValidator)
  .addValidator(
    "icon",
    new PropertyValidator<string | null>(
      "string | null",
      (value): value is string | null => typeof value === "string" || value === null,
    ),
  )
  .addValidator("lang", new UnionValidator(SupportedLanguages.map((l) => l.value)));

export const PATCH = async ({ locals, request }) => {
  if (locals.guildId && locals.token) {
    const update = (await request.json()) as Record<string, any>;
    const result = baseConfigValidator.validate(update);
    if (!result.isValid) {
      console.debug("Validation errors", result.errors);
      return Response.json(result, { status: 400, statusText: "Bad Request" });
    }

    await updateGuild(locals.guildId, {
      $set: {
        ...result.value,
      },
    });

    const newDoc = await getGuild(locals.guildId);
    console.debug("Updated guild", newDoc);
    return Response.json(newDoc, { status: 200, statusText: "OK" });
  }

  return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
};
