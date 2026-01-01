import { JsonErrors } from "$lib/constants.js";
import {
  FlattenDocToJSON,
  getDBGuild,
  updateDBGuild,
  type DBGuildProjectionReturns,
} from "$lib/server/db/utils.js";
import { ZodValidator } from "$lib/server/validators";
import type { IDBGuild } from "$lib/sm-types";
import { APIPausedUntilSchema, SnowflakePredicate } from "$v1Api/assertions.js";
import dayjs from "dayjs";
import type { UpdateQuery } from "mongoose";
import z from "zod";

export async function GET({ params }) {
  try {
    const config = await getDBGuild(params.guildid, "generalTicketSettings");
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
  enabled: z.boolean(),
  autoForwarding: z.boolean(),
  allowedBots: z.array(SnowflakePredicate),
  anonym: z
    .object({
      enabled: z.boolean().optional(),
      user: z.boolean().optional(),
    })
    .default({
      enabled: false,
      user: false,
    }),
  pausedUntil: APIPausedUntilSchema.default({ date: null, value: false }),
});

export type TicketsPUTFields = z.infer<typeof patchSchema>;

export async function PUT({ request, params }) {
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
  const { data } = validationRes;

  const pauseDjs = data.pausedUntil.date ? dayjs(data.pausedUntil.date) : null;
  if (pauseDjs && !pauseDjs.isValid()) {
    return JsonErrors.badRequest("Invalid Date.");
  } else if (pauseDjs?.isBefore(new Date())) {
    return JsonErrors.badRequest("Invalid Date. Must be in the future!");
  }

  if (!guild.ticketConfig.forumId && data.enabled) {
    return JsonErrors.conflict("Cannot enable tickets when no forum is set.");
  }

  let updateFields: UpdateQuery<IDBGuild> = {
    $set: {
      "ticketConfig.pausedUntil": {
        value: data.pausedUntil.value,
        date: pauseDjs?.toDate() ?? null,
      },
      "ticketConfig.enabled": guild.ticketConfig.forumId ? data.enabled : false,
      "ticketConfig.forumId": guild.ticketConfig.forumId,
      "ticketConfig.allowedBots": data.allowedBots,
      "ticketConfig.anonym": data.anonym,
      "ticketConfig.autoForwarding": data.autoForwarding,
    },
  };

  console.log("Update Fields", updateFields);

  try {
    const newGuild = await updateDBGuild(params.guildid, updateFields);
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
