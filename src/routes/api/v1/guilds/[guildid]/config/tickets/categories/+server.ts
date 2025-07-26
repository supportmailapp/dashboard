import { JsonErrors } from "$lib/constants.js";
import { FlattenDocToJSON, getTicketCategories, TicketCategory } from "$lib/server/db";
import {
  CustomModalFieldPredicate,
  MentionableEntityPredicate,
  PartialEmojiPredicate,
  SnowflakePredicate,
  ZodValidator,
} from "$lib/server/validators/index.js";
import type { ITicketCategory } from "supportmail-types";
import z from "zod";

export async function GET({ locals: { guildId } }) {
  const cats = await getTicketCategories(guildId!);
  return Response.json(cats.map((cat) => FlattenDocToJSON(cat, true)));
}

const postSchema = z.object({
  label: z.string().min(3).max(45),
});

type PostSchema = z.infer<typeof postSchema>;

export async function POST({ request, locals }) {
  const guildId = locals.guildId!;
  if (!locals.isAuthenticated()) {
    return JsonErrors.unauthorized();
  }

  const body = await request.json();

  const valRes = new ZodValidator(postSchema).validate(body);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  valRes.data.label = valRes.data.label.trim();

  const existing = await getTicketCategories(guildId, valRes.data.label);
  if (existing.length > 0) {
    return JsonErrors.conflict(`A ticket category with the label "${valRes.data.label}" already exists.`);
  }

  const cat = await TicketCategory.create({
    guildId: guildId,
    label: valRes.data.label,
  });

  return Response.json(FlattenDocToJSON(cat, true), {
    status: 201,
  });
}
