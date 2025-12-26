import { JsonErrors } from "$lib/constants";
import { DBGuild, FlattenDocToJSON, getDBGuild } from "$lib/server/db/index.js";
import { CustomModalFieldSchema, ZodValidator } from "$lib/server/validators/index.js";
import type { IDBGuild } from "$lib/sm-types";
import { hasAllKeys } from "$lib/utils";
import { reindexArrayByKey } from "$lib/utils/formatting.js";
import type { UpdateQuery } from "mongoose";
import z from "zod";

export async function GET({ locals: { guildId } }) {
  if (!guildId) {
    return JsonErrors.badRequest();
  }

  try {
    const config = await getDBGuild(guildId, "feedback");
    if (!config) {
      return JsonErrors.notFound();
    }

    if (config && typeof config.isEnabled === "undefined") {
      console.warn("[GET] isEnabled was undefined, checking tags for default value");
      config.isEnabled = hasAllKeys(config.tags ?? {}, ["one", "two", "three", "four", "five"]);
    }

    console.log("Fetched guild ticket config:", config);

    return Response.json(config);
  } catch (err: any) {
    console.error("Error fetching guild ticket config:", err);
    return JsonErrors.serverError();
  }
}

const putSchema = z
  .object({
    isEnabled: z.boolean(),
    questions: CustomModalFieldSchema.array().min(0).max(5).optional(),
    thankYou: z.string().optional(),
  })
  .default({ isEnabled: false });

export async function PUT({ request, locals }) {
  if (!locals.isAuthenticated() || !locals.guildId) return JsonErrors.unauthorized();

  const body = await request.json().catch(() => undefined);
  if (!body) return JsonErrors.badRequest("Invalid JSON body");

  const valRes = new ZodValidator(putSchema).validate(body);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  const { isEnabled, questions, thankYou } = valRes.data;
  console.log("feedback config update data:", valRes.data);
  const updatePayload: UpdateQuery<IDBGuild> = {
    "ticketConfig.feedback.isEnabled": isEnabled,
    "ticketConfig.feedback.thankYou": thankYou?.trim(),
  };

  const sortedQuestions = reindexArrayByKey(
    questions?.sort((a, b) => a.position - b.position),
    "position",
  );

  updatePayload["ticketConfig.feedback.questions"] = sortedQuestions;

  try {
    const newDoc = await DBGuild.findOneAndUpdate({ id: locals.guildId }, updatePayload, { new: true });
    if (!newDoc || !newDoc.ticketConfig.feedback) {
      return JsonErrors.notFound("Guild not found or update failed");
    }

    const json = FlattenDocToJSON(newDoc, true);
    const feedbackConfig = json.ticketConfig.feedback!;

    // Ensure isEnabled is properly set in the response
    if (typeof feedbackConfig.isEnabled === "undefined") {
      console.warn("[PUT] isEnabled was undefined, checking tags for default value");
      feedbackConfig.isEnabled = hasAllKeys(feedbackConfig.tags ?? {}, [
        "one",
        "two",
        "three",
        "four",
        "five",
      ]);
    }

    console.log("Updated guild ticket config:", feedbackConfig);
    return Response.json(feedbackConfig);
  } catch (err: any) {
    console.error("Error updating guild ticket config:", err);
    return JsonErrors.serverError(err.message || "Failed to update ticket config");
  }
}
