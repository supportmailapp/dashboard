import { JsonErrors } from "$lib/constants.js";
import { TicketCategory } from "$lib/server/db/index.js";
import clientApi, { ClientApiRoutes } from "$lib/server/utils/clientApi.js";
import { ZodValidator } from "$lib/server/validators/index.js";
import { ObjectIdSchema } from "$v1Api/assertions.js";
import { json } from "@sveltejs/kit";
import z from "zod";

const predicate = z
  .object({ _id: ObjectIdSchema, setTag: z.boolean().default(false) })
  .array()
  .nonempty()
  .max(20);

export async function POST({ request, params }) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return JsonErrors.badRequest("Invalid JSON body.");
  }

  const valRes = new ZodValidator(predicate).validate(body);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message || "Invalid request body.");
  }

  const categories = await TicketCategory.find({
    guildId: params.guildid,
    _id: { $in: valRes.data.map((v) => v._id) },
  });
  const catsToSet = new Set(valRes.data.filter((v) => v.setTag).map((v) => v._id));

  // The first filter ensures, we only process categories that need updating:
  // - Categories that do not have a tag but should get one set
  // - Categories that have a tag but should have it removed
  const payload =
    categories
      ?.filter(
        (c) => (!c.tag && catsToSet.has(c._id.toString())) || (c.tag && !catsToSet.has(c._id.toString())),
      )
      .map((c) => ({
        _id: c._id.toString(),
        label: c.label,
        emoji: c.emoji,
        removeTag: !valRes.data.find((v) => v._id === c._id.toString())?.setTag,
        tag: c.tag ?? undefined,
      })) || [];

  console.log(payload);

  const res = await clientApi.post<ClientAPI.CategoriesTagsResult>(ClientApiRoutes.syncTags(), {
    json: {
      guildId: params.guildid,
      categories: payload,
    } satisfies ClientAPI.CategoriesTagsUpdate,
  });

  const resres = await res.json().catch(() => null);

  if (!res.ok || !resres) {
    return json({ message: resres?.error || "Failed to update category tags." }, { status: res.status });
  }

  return json({ success: true, data: resres.data });
}
