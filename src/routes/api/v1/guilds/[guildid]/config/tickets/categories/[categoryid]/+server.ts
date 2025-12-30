import { JsonErrors } from "$lib/constants";
import { FlattenDocToJSON, getTicketCategories, TicketCategory } from "$lib/server/db";
import {
  CustomModalFieldSchema,
  MentionableEntityPredicate,
  PartialEmojiPredicate,
  SnowflakePredicate,
  ZodValidator,
} from "$lib/server/validators";
import { reindexArrayByKey } from "$lib/utils/formatting.js";
import z from "zod";

const putSchema = z.object({
  _id: z.string(),
  guildId: SnowflakePredicate,
  label: z.string().min(3).max(45),
  emoji: PartialEmojiPredicate.optional(),
  enabled: z.boolean().default(true),
  tag: SnowflakePredicate.optional(),
  pings: MentionableEntityPredicate.array().optional(),
  fields: CustomModalFieldSchema.array().min(0).max(5).optional(),
  customMessageId: z.string().optional(),
});

// It may be a PUT endpoint, but the index field is not allowed to be passed, because it is managed by the server.
// To change the index (order) of categories, use the PUT endpoint at /api/v1/guilds/[guildid]/config/tickets/categories
export async function PUT({ request, locals, params: { categoryid } }) {
  const guildId = locals.guildId!;
  if (!locals.isAuthenticated()) {
    return JsonErrors.unauthorized();
  }

  const body = await request.json();

  const valRes = new ZodValidator(putSchema).validate(body);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  valRes.data.guildId = guildId;

  if (categoryid !== valRes.data._id) {
    return JsonErrors.badRequest("Category ID in the URL does not match the ID in the request body.");
  }

  const existing = await getTicketCategories(guildId, valRes.data.label);
  if (existing.length > 1) {
    return JsonErrors.conflict(`A ticket category with the label "${valRes.data.label}" already exists.`);
  }

  // Everything except the _id
  const sanitizedData = Object.fromEntries(
    Object.entries(valRes.data).filter(([key]) => key !== "_id"),
  ) as Omit<typeof valRes.data, "_id">;

  // Ensure fields are ordered by position and re-index them
  sanitizedData.fields = reindexArrayByKey(
    sanitizedData.fields?.sort((a, b) => a.position - b.position),
    "position",
  );

  const cat = await TicketCategory.findOneAndUpdate({ guildId, _id: valRes.data._id }, sanitizedData, {
    upsert: true,
    new: true,
  });

  return Response.json(FlattenDocToJSON(cat, true), {
    status: cat ? 200 : 201,
  });
}

export async function DELETE({ locals, params: { categoryid } }) {
  const guildId = locals.guildId!;
  const categoryId = categoryid;
  if (!locals.isAuthenticated()) {
    return JsonErrors.unauthorized();
  }

  const cat = await TicketCategory.findOneAndDelete({ _id: categoryId, guildId });

  if (!cat) {
    return JsonErrors.notFound(`Ticket category with ID "${categoryId}" not found.`);
  }

  // Update the index field on remaining categories
  const remainingCategories = await TicketCategory.find({ guildId }).sort({ index: 1 });

  for (let i = 0; i < remainingCategories.length; i++) {
    await TicketCategory.updateOne({ _id: remainingCategories[i]._id }, { index: i + 1 });
  }

  return new Response(null, {
    status: 204,
  });
}
