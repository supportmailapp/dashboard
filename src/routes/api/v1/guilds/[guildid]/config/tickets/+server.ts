import { JsonErrors } from "$lib/constants.js";
import { FlattenDocToJSON, type DBGuildProjectionReturns } from "$lib/server/db/utils.js";
import { getDBGuild, updateDBGuild } from "$lib/server/db/utils.js";
import { ZodValidator } from "$lib/server/validators";
import { SnowflakePredicate } from "$lib/server/validators";
import { isNotUndefined } from "$lib/utils.js";
import type { UpdateQuery } from "mongoose";
import type { IDBGuild } from "supportmail-types";
import z from "zod";

export async function GET({ locals: { guildId } }) {
  if (!guildId) {
    return JsonErrors.badRequest();
  }

  try {
    const config = await getDBGuild(guildId, "generalTicketSettings");
    if (!config) {
      return JsonErrors.notFound();
    }

    return Response.json({
      ...config,
      allowedBots: config.allowedBots ?? [],
      pausedUntil: config.pausedUntil ?? {
        value: false,
        date: null,
      },
    } as DBGuildProjectionReturns["generalTicketSettings"]);
  } catch (err: any) {
    console.error("Error fetching guild ticket config:", err);
    return JsonErrors.serverError();
  }
}

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  autoForwarding: z.boolean().optional(),
  allowedBots: z.array(SnowflakePredicate).optional(),
  anonym: z
    .object({
      enabled: z.boolean().optional(),
      user: z.boolean().optional(),
    })
    .optional(),
});

export type PatchFields = z.infer<typeof patchSchema>;

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
  const validationRes = new ZodValidator(patchSchema).validate(body);

  if (!validationRes.success) {
    return JsonErrors.badRequest(validationRes.error.message);
  }

  const guild = await getDBGuild(locals.guildId, "full");
  if (!guild) {
    return JsonErrors.notFound();
  }
  const { allowedBots, anonym, autoForwarding, enabled } = validationRes.data;

  let updateFields: UpdateQuery<IDBGuild> = {};
  if (isNotUndefined(allowedBots)) {
    updateFields["ticketConfig.allowedBots"] = allowedBots;
  }
  if (isNotUndefined(anonym)) {
    updateFields["ticketConfig.anonym"] = anonym;
  }
  if (isNotUndefined(autoForwarding)) {
    updateFields["ticketConfig.autoForwarding"] = autoForwarding;
  }
  // Only allow changing the status if a forum is actually set
  if (isNotUndefined(enabled) && !!guild.ticketConfig.forumId) {
    updateFields["ticketConfig.enabled"] = enabled;
  }

  console.log("Update Fields", updateFields);

  try {
    const newGuild = await updateDBGuild(locals.guildId, updateFields);
    if (!newGuild) {
      return JsonErrors.notFound("Guild not found");
    }

    const { ticketConfig } = FlattenDocToJSON(newGuild);

    console.log("Updated Fields (ticketConfig)", ticketConfig);

    return Response.json({
      anonym: ticketConfig.anonym,
      autoForwarding: ticketConfig.autoForwarding,
      enabled: ticketConfig.enabled,
      forumId: ticketConfig.forumId,
      pausedUntil: ticketConfig.pausedUntil ?? null,
      allowedBots: ticketConfig.allowedBots,
    } as DBGuildProjectionReturns["generalTicketSettings"]);
  } catch (err: any) {
    console.error("Error updating guild config:", err);
    return JsonErrors.serverError();
  }
}
