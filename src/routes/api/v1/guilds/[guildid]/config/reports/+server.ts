import { JsonErrors } from "$lib/constants.js";
import {
  FlattenDocToJSON,
  getDBGuild,
  updateDBGuild,
  type DBGuildProjectionReturns,
} from "$lib/server/db/utils.js";
import { ZodValidator } from "$lib/server/validators";
import { ReportNotificationType, SpecialReportChannelType, type IDBGuild } from "$lib/sm-types";
import { zem } from "$lib/utils.js";
import { APIPausedUntilSchema, MentionableEntity, SnowflakePredicate } from "$v1Api/assertions.js";
import { json } from "@sveltejs/kit";
import dayjs from "dayjs";
import type { UpdateQuery } from "mongoose";
import z from "zod";

export async function GET({ params }) {
  const guildId = params.guildid;

  try {
    const config = await getDBGuild(guildId, "reportSettings");
    if (!config) {
      return JsonErrors.notFound();
    }

    return json({
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
    .array()
    .max(100, zem("Maximum of 100 channels can be set.")),
});

const limitSchema = z.object({
  perUserReceive: z.int().min(1, zem("Minimum value is 1")).max(10, zem("Maximum value is 10")).default(1),
  perUserCreate: z.int().min(1, zem("Minimum value is 1")).max(50, zem("Maximum value is 50")).default(5),
  opens: z.int().min(1, zem("Minimum value is 1")).max(100, zem("Maximum value is 100")).default(20),
});

const notificationSchema = z
  .enum(ReportNotificationType)
  .array()
  .refine((arr) => arr.length === new Set(arr).size, zem("Duplicate notification types are not allowed."));

const putSchema = z
  .object({
    channelId: SnowflakePredicate.nullable().default(null),
    enabled: z.boolean().default(false),
    actionsEnabled: z.boolean().default(true),
    channels: channelsSchema.default({
      setting: "EX",
      ids: [],
    }),
    pings: MentionableEntity.array().max(100, zem("Maximum of 100 pings can be set.")).default([]),
    immune: MentionableEntity.array().max(100, zem("Maximum of 100 immune entities can be set.")).default([]),
    mods: MentionableEntity.array().max(100, zem("Maximum of 100 mods can be set.")).default([]),
    limits: limitSchema.default({
      perUserReceive: 1,
      perUserCreate: 5,
      opens: 20,
    }),
    notifications: notificationSchema.optional(),
    pausedUntil: APIPausedUntilSchema.default({ date: null, value: false }),
  })
  .refine(
    (data) => (data.enabled && !!data.channelId) || !data.enabled,
    zem("Invalid configuration: Channel ID must be set when reports are enabled."),
  );

export type PutFields = z.infer<typeof putSchema>;

// Currently, this endpoint only supports updating the language setting,
// since it's the only "global" setting that can be changed per guild.
export async function PUT({ request, locals, params }) {
  if (!locals.token) {
    return JsonErrors.badRequest();
  }

  const body = await request.json();
  console.log("PUT body:", body);
  if (!body) {
    return JsonErrors.badRequest("Missing body?");
  }

  // Validation
  const valRes = new ZodValidator(putSchema).validate(body);
  if (!valRes.success) {
    console.error(valRes.error);
    return JsonErrors.badRequest(valRes.error.message);
  }

  const guild = await getDBGuild(params.guildid, "full");
  if (!guild) {
    return JsonErrors.notFound();
  }

  const { data } = valRes;

  const pauseDjs = data.pausedUntil.date ? dayjs(data.pausedUntil.date) : null;
  if (pauseDjs && !pauseDjs.isValid()) {
    return JsonErrors.badRequest("Invalid Date.");
  } else if (pauseDjs?.isBefore(new Date())) {
    return JsonErrors.badRequest("Invalid Date. Must be in the future!");
  }

  const updateFields: UpdateQuery<IDBGuild> = {
    $set: {
      "reportConfig.enabled": data.enabled,
      "reportConfig.pausedUntil": {
        value: data.pausedUntil.value,
        date: pauseDjs?.toDate() ?? null,
      },
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
    const newGuild = await updateDBGuild(params.guildid, updateFields);
    if (!newGuild) {
      return JsonErrors.notFound("Guild not found");
    }

    const { reportConfig } = FlattenDocToJSON(newGuild);

    console.log("Updated Fields (reportConfig)", reportConfig);

    return json({
      ...reportConfig,
      pausedUntil: reportConfig.pausedUntil ?? null,
    } as DBGuildProjectionReturns["reportSettings"]);
  } catch (err: any) {
    console.error("Error updating guild config:", err);
    return JsonErrors.serverError();
  }
}
