import { JsonErrors } from "$lib/constants.js";
import { CommandConfig, FlattenBigIntFields, FlattenDocToJSON } from "$lib/server/db/index.js";
import { ZodValidator } from "$lib/server/validators/index.js";
import type { APICommandConfig } from "$lib/sm-types/src/index.js";
import { zem } from "$lib/utils.js";
import { CommandConfigPutSchema } from "$v1Api/assertions.js";
import { json } from "@sveltejs/kit";

export async function GET({ params }) {
  const cfgs = await CommandConfig.find({
    guildId: params.guildid,
    id: params.commandid,
  });

  if (!cfgs || cfgs.length === 0) {
    return JsonErrors.notFound("Command configuration not found");
  }

  return json(cfgs.map((c) => FlattenDocToJSON(c)).map(FlattenBigIntFields));
}

export async function PUT({ request, params }) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return JsonErrors.badRequest("Invalid JSON body");
  }

  const valRes = new ZodValidator(
    CommandConfigPutSchema.refine(
      (datas) => datas.every((data) => data.guildId === params.guildid && data.id === params.commandid),
      zem("guildId and id must match URL parameters"),
    ),
  ).validate(body);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  let cfgs: APICommandConfig[] = [];
  for (const data of valRes.data) {
    const cfg = await CommandConfig.findOneAndUpdate(
      {
        guildId: params.guildid,
        id: params.commandid,
      },
      data,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    cfgs.push(FlattenBigIntFields(FlattenDocToJSON(cfg)));
  }

  return json(cfgs);
}
