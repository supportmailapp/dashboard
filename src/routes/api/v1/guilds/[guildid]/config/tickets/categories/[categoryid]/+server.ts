import { JsonErrors } from "$lib/constants";
import { FlattenDocToJSON, getTicketCategories, TicketCategory } from "$lib/server/db";
import { ZodValidator } from "$lib/server/validators";
import { TicketCategorySchema } from "$v1Api/assertions.js";

// It may be a PUT endpoint, but the index field is not allowed to be passed, because it is managed by the server.
// To change the index (order) of categories, use the PUT endpoint at /api/v1/guilds/[guildid]/config/tickets/categories
export async function PUT({ request, locals, params }) {
  const guildId = params.guildid;
  const categoryId = params.categoryid;
  if (!locals.isAuthenticated()) {
    return JsonErrors.unauthorized();
  }

  const body = await request.json();

  const valRes = new ZodValidator(TicketCategorySchema.omit({ index: true })).validate(body);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  valRes.data.guildId = guildId;

  if (categoryId !== valRes.data._id) {
    return JsonErrors.badRequest("Category ID in the URL does not match the ID in the request body.");
  }

  const existing = (await getTicketCategories(guildId, valRes.data.label)) ?? [];
  // If any existing category with the same label has a different id, it's a conflict
  if (existing.some((c) => String(c._id) !== String(valRes.data._id))) {
    return JsonErrors.conflict(`A ticket category with the label "${valRes.data.label}" already exists.`);
  }

  // Everything except the _id
  const sanitizedData = Object.fromEntries(
    Object.entries(valRes.data).filter(([key]) => key !== "_id"),
  ) as Omit<typeof valRes.data, "_id">;

  const cat = await TicketCategory.findOneAndUpdate({ guildId, _id: valRes.data._id }, sanitizedData, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });

  return Response.json(FlattenDocToJSON(cat, true), {
    status: cat ? 200 : 201,
  });
}

export async function DELETE({ params }) {
  const guildId = params.guildid;
  const categoryId = params.categoryid;

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
