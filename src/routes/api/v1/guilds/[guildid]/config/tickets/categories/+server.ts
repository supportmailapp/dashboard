import { JsonErrors } from "$lib/constants.js";
import { FlattenDocToJSON, getTicketCategories, TicketCategory } from "$lib/server/db";
import { SnowflakePredicate, ZodValidator } from "$lib/server/validators/index.js";
import z from "zod";

export async function GET({ locals: { guildId } }) {
  const cats = await getTicketCategories(guildId!);
  return Response.json(cats.map((cat) => FlattenDocToJSON(cat, true)));
}

const postSchema = z.object({
  label: z.string().min(3).max(45),
});

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

  const existingCount = await TicketCategory.countDocuments({ guildId });

  const cat = await TicketCategory.create({
    guildId: guildId,
    label: valRes.data.label,
    index: existingCount + 1, // Set index to the next available position
  });

  console.log("Created new ticket category:", cat);

  return Response.json(FlattenDocToJSON(cat, true), {
    status: 201,
  });
}

const putSchema = z
  .object({
    _id: z.string(),
    guildId: SnowflakePredicate,
    index: z.number().int().min(1).max(10),
  })
  .array();

export async function PUT({ request, locals }) {
  // This endpoint accepts an array of ticket categories to reorder.
  // It expects the request body to be an array of objects with the following structure:
  // { _id: string, index: number }
  if (!locals.isAuthenticated()) {
    return JsonErrors.unauthorized();
  }

  const guildId = locals.guildId!;
  const body = await request.json();

  const valRes = new ZodValidator(putSchema).validate(body);

  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  // Validate that the guildId matches the one in the locals
  for (const category of valRes.data) {
    if (category.guildId !== guildId) {
      return JsonErrors.badRequest(`Guild ID in the request body does not match the authenticated guild ID.`);
    }
  }

  // Ensure, the .index starts at 1 and is sequential
  const sortedCategories = valRes.data.sort((a, b) => a.index - b.index);
  const uniqueIndexes = new Set(sortedCategories.map((cat) => cat.index));
  if (uniqueIndexes.size !== sortedCategories.length) {
    return JsonErrors.badRequest("Category indexes must be unique.");
  }
  for (let i = 0; i < sortedCategories.length; i++) {
    sortedCategories[i].index = i + 1; // Re-index to ensure they are sequential
  }

  // Update the categories in the database
  const updatePromises = sortedCategories.map((category) =>
    TicketCategory.findOneAndUpdate(
      { guildId, _id: category._id },
      { index: category.index },
      { new: true, upsert: true },
    ),
  );
  try {
    const updatedCategories = await Promise.all(updatePromises);
    return Response.json(
      updatedCategories.map((cat) => FlattenDocToJSON(cat, true)),
      {
        status: 200,
      },
    );
  } catch (error: any) {
    return JsonErrors.serverError(String(error?.message ?? error));
  }
}
