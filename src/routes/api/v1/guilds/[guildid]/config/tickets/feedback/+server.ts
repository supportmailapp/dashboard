import { JsonErrors } from "$lib/constants";
import { FeedbackConfig, FlattenDocToJSON } from "$lib/server/db/index.js";
import { ZodValidator } from "$lib/server/validators/index.js";
import type { IFeedbackConfig } from "$lib/sm-types";
import { FeedbackConfigSchema } from "$v1Api/assertions.js";
import { json } from "@sveltejs/kit";
import type { UpdateQuery } from "mongoose";

export async function GET({ params }) {
  try {
    const config = await FeedbackConfig.findOne({ guildId: params.guildid });
    if (!config) {
      return json({
        guildId: params.guildid,
        isEnabled: false,
        components: [],
      });
    }

    return json(FlattenDocToJSON(config, true, ["tags", "questions"]));
  } catch (err: any) {
    console.error("Error fetching guild ticket config:", err);
    return JsonErrors.serverError();
  }
}

export async function PUT({ request, params }) {
  const body = await request.json().catch(() => undefined);
  if (!body) return JsonErrors.badRequest("Invalid JSON body");

  const valRes = new ZodValidator(FeedbackConfigSchema).validate(body);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  const updatePayload: UpdateQuery<IFeedbackConfig> = {
    ...valRes.data,
  };

  try {
    const newDoc = await FeedbackConfig.findOneAndUpdate({ guildId: params.guildid }, updatePayload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    return json(FlattenDocToJSON(newDoc, true));
  } catch (err: any) {
    console.error("Error updating guild ticket config:", err);
    return JsonErrors.serverError(err.message || "Failed to update ticket config");
  }
}
