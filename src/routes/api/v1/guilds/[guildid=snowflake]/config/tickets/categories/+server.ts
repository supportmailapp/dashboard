import { JsonErrors } from "$lib/constants.js";
import { FlattenDocToJSON, getTicketCategories, TicketCategory } from "$lib/server/db";
import { ZodValidator } from "$lib/server/validators/index.js";
import type { ITicketCategory } from "$lib/sm-types";
import { zem } from "$lib/utils.js";
import { TicketCategoriesPUTSchema } from "$v1Api/assertions";
import { json } from "@sveltejs/kit";
import type { HydratedDocument } from "mongoose";

export async function GET({ params, url }) {
  const partial = url.searchParams.get("partial") === "true";
  if (partial) {
    const cats = await TicketCategory.find({ guildId: params.guildid }, { label: 1, _id: 1 });
    return json(
      cats.sort((a, b) => a.index - b.index).map((cat) => ({ _id: cat._id.toString(), label: cat.label })),
    );
  }
  const cats = await getTicketCategories(params.guildid);
  return json(
    cats
      .sort((a, b) => a.index - b.index)
      .map((cat) => ({ _id: cat._id.toString(), label: cat.label, index: cat.index, tag: cat.tag })),
  );
}

export async function PUT({ request, params }) {
  const guildId = params.guildid;
  const body = await request.json();

  const valRes = new ZodValidator(
    TicketCategoriesPUTSchema.refine(
      (data) => data.every((cat) => cat.guildId === guildId),
      zem("Guild ID doesn't match."),
    ),
  ).validate(body);

  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  // ensure index is sequential and starts from 0
  valRes.data.sort((a, b) => a.index - b.index);
  const sanitizedData = valRes.data.map((cat, idx) => ({ ...cat, index: idx }));

  const toUpdate = sanitizedData.filter((cat) => !cat.local);
  const toCreate = sanitizedData.filter((cat) => cat.local);

  const cats: HydratedDocument<ITicketCategory>[] = [];
  if (toUpdate.length > 0) {
    const updated = await Promise.all(
      toUpdate.map((category) =>
        TicketCategory.findOneAndUpdate(
          { guildId, _id: category._id },
          { index: category.index },
          { returnDocument: "after", upsert: true },
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
  return json(finalCats);
}
