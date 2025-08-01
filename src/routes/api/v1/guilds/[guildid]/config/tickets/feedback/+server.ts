import { JsonErrors } from "$lib/constants";
import { FlattenDocToJSON, getDBGuild, updateDBGuild } from "$lib/server/db";
import { CustomModalFieldPredicate, SnowflakePredicate, ZodValidator } from "$lib/server/validators/index.js";
import type { UpdateQuery } from "mongoose";
import type { IDBGuild } from "supportmail-types";
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

    return Response.json(config);
  } catch (err: any) {
    console.error("Error fetching guild ticket config:", err);
    return JsonErrors.serverError();
  }
}

const putSchema = z.object({
  postId: SnowflakePredicate.optional(),
  questions: CustomModalFieldPredicate.array().min(0).max(5).optional(),
  thankYou: z.string(),
});

export async function PUT({ request, locals }) {
  if (!locals.isAuthenticated()) return JsonErrors.unauthorized();

  const body = await request.json().catch(() => undefined);
  if (!body) return JsonErrors.badRequest("Invalid JSON body");

  const valRes = new ZodValidator(putSchema).validate(body);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  const { postId, questions, thankYou } = valRes.data;
  const updatePayload: UpdateQuery<IDBGuild> = {
    $set: {
      "ticketConfig.feedback": thankYou.trim(),
      "ticketConfig.questions": questions?.length ? questions : undefined, // If no questions, set to undefined
    },
  };
  if (typeof postId === "string") {
    // If postId is provided, feedback is enabled - ergo, all other fields are settable
    updatePayload.$set!["ticketConfig.postId"] = postId;
  } else {
    // If postId is not provided, feedback is disabled - ergo, tags must be cleared
    updatePayload.$unset = {
      tags: "",
      postId: "",
    };
  }

  try {
    const newDoc = await updateDBGuild(locals.guildId!, updatePayload);
    if (!newDoc) {
      return JsonErrors.notFound("Guild not found or update failed");
    }

    const json = FlattenDocToJSON(newDoc);
    return Response.json(json);
  } catch (err: any) {
    console.error("Error updating guild ticket config:", err);
    return JsonErrors.serverError(err.message || "Failed to update ticket config");
  }
}
