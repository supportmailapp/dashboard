import { JsonErrors } from "$lib/constants.js";
import { FlattenDocToJSON, getTicketCategories, TicketCategory } from "$lib/server/db";
import { ZodValidator } from "$lib/server/validators/index.js";
import type { ITicketCategory } from "$lib/sm-types/src/index.js";
import { TicketCategoriesPUTSchema } from "$v1Api/assertions";
import { json } from "@sveltejs/kit";
import type { HydratedDocument } from "mongoose";

export async function GET({ params }) {
  const cats = await getTicketCategories(params.guildid);
  return json(
    cats
      .sort((a, b) => a.index - b.index)
      .map((cat) => ({ _id: cat._id.toString(), label: cat.label, index: cat.index })),
  );
}

export async function PUT({ request, params }) {
  const guildId = params.guildid;
  const body = await request.json();

  const valRes = new ZodValidator(TicketCategoriesPUTSchema).validate(body);

  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  // Validate that the guildId matches the one in the locals
  for (const category of valRes.data) {
    if (category.guildId !== guildId) {
      return JsonErrors.badRequest(`Guild ID in the request body does not match the authenticated guild ID.`);
    }
  }

  // ensure index is sequential and starts from 0
  valRes.data.sort((a, b) => a.index - b.index);
  const sanitizedData = valRes.data.map((cat, idx) => ({ ...cat, index: idx }));

  const toUpdate = sanitizedData.filter((cat) => !cat.local);
  const toCreate = sanitizedData.filter((cat) => cat.local);

  const cats: HydratedDocument<ITicketCategory>[] = [];
  if (toCreate.length > 0) {
    const updated = await Promise.all(
      toUpdate.map((category) =>
        TicketCategory.findOneAndUpdate(
          { guildId, _id: category._id },
          { index: category.index },
          { new: true, upsert: true },
        ),
      ),
    );
    cats.push(...updated);
  }

  if (toCreate.length > 0) {
    const created = await TicketCategory.insertMany(
      toCreate.map((category) => ({
        guildId,
        label: category.label,
        index: category.index,
      })),
    );
    cats.push(...created);
  }

  const finalCats = cats.map((cat) => FlattenDocToJSON(cat, true));
}
