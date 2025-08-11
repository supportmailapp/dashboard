import { JsonErrors } from "$lib/constants.js";
import { FlattenDocToJSON, type DBGuildProjectionReturns } from "$lib/server/db/utils.js";
import { getDBGuild, updateDBGuild } from "$lib/server/db/utils.js";
import { MentionableEntityPredicate, ZodValidator } from "$lib/server/validators";
import { SnowflakePredicate } from "$lib/server/validators";
import { isNotUndefined } from "$lib/utils.js";
import type { UpdateQuery } from "mongoose";
import { ReportNotificationType, SpecialReportChannelType, type IDBGuild } from "supportmail-types";
import z from "zod";

export async function GET({ locals: { guildId } }) {
  if (!guildId) {
    return JsonErrors.badRequest();
  }

  try {
    const config = await getDBGuild(guildId, "reportSettings");
    if (!config) {
      return JsonErrors.notFound();
    }

    return Response.json({
      ...config,
      pausedUntil: config.pausedUntil ?? {
        value: false,
        date: null,
      },
    } as DBGuildProjectionReturns["reportSettings"]);
  } catch (err: any) {
    console.error("Error fetching guild report config:", err);
    return JsonErrors.serverError();
  }
}

const channelsSchema = z.object({
  setting: z.enum(["IN", "EX"]),
  ids: z
    .object({
      t: z.enum(SpecialReportChannelType),
      id: SnowflakePredicate,
    })
    .array(),
});

const limitSchema = z.object({
  perUserReceive: z.number().int().min(1).max(10).optional(),
  perUserCreate: z.number().int().min(1).max(50).optional(),
  opens: z.number().int().min(1).max(100).optional(),
});

const notificationSchema = z.enum(ReportNotificationType).array();

const putSchema = z
  .object({
    channelId: SnowflakePredicate.nullable().default(null),
    enabled: z.boolean().default(false),
    actionsEnabled: z.boolean().default(true),
    channels: channelsSchema.default({
      setting: "EX",
      ids: [],
    }),
    pings: MentionableEntityPredicate.array().default([]),
    immune: MentionableEntityPredicate.array().default([]),
    mods: MentionableEntityPredicate.array().default([]),
    limits: limitSchema.default({
      perUserReceive: 1,
      perUserCreate: 5,
      opens: 20,
    }),
    notifications: notificationSchema.optional(),
  })
  .refine(
    (data) => {
      // Ensure channelId is set if enabled is true
      if (data.enabled && !data.channelId) {
        throw new Error("Channel ID must be set when reports are enabled.");
      }
      return true;
    },
    {
      error: "Invalid configuration: Channel ID must be set when reports are enabled.",
    },
  );

export type PutFields = z.infer<typeof putSchema>;

// Currently, this endpoint only supports updating the language setting,
// since it's the only "global" setting that can be changed per guild.
export async function PUT({ request, locals }) {
  if (!locals.guildId || !locals.token) {
    return JsonErrors.badRequest();
  }

  const body = await request.json();
  console.log("PUT body:", body);
  if (!body) {
    return JsonErrors.badRequest("Missing body?");
  }

  // Validation
  const validationRes = new ZodValidator(putSchema).validate(body);

  if (!validationRes.success) {
    console.error(validationRes.error);
    return JsonErrors.badRequest(ZodValidator.toHumanError(validationRes.error));
  }

  const guild = await getDBGuild(locals.guildId, "full");
  if (!guild) {
    return JsonErrors.notFound();
  }

  const { data } = validationRes;

  const updateFields: UpdateQuery<IDBGuild> = {
    $set: {
      "reportConfig.enabled": data.enabled,
      "reportConfig.channelId": data.channelId,
      "reportConfig.actionsEnabled": data.actionsEnabled,
      "reportConfig.channels": data.channels,
      "reportConfig.pings": data.pings,
      "reportConfig.immune": data.immune,
      "reportConfig.mods": data.mods,
      "reportConfig.limits": data.limits,
      "reportConfig.notifications": data.notifications,
    },
  };

  console.log("Update Fields", updateFields);

  try {
    const newGuild = await updateDBGuild(locals.guildId, updateFields);
    if (!newGuild) {
      return JsonErrors.notFound("Guild not found");
    }

    const { reportConfig } = FlattenDocToJSON(newGuild);

    console.log("Updated Fields (reportConfig)", reportConfig);

    return Response.json({
      ...reportConfig,
      pausedUntil: reportConfig.pausedUntil ?? {
        value: false,
        date: null,
      },
    } as DBGuildProjectionReturns["reportSettings"]);
  } catch (err: any) {
    console.error("Error updating guild config:", err);
    return JsonErrors.serverError();
  }
}
