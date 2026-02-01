import { CommandpathRegex, JsonErrors } from "$lib/constants.js";
import { CommandConfig, FlattenBigIntFields, FlattenDocToJSON } from "$lib/server/db/index.js";
import { ZodValidator } from "$lib/server/validators/index.js";
import type { APICommandConfig, ICommandConfig } from "$lib/sm-types/src/index.js";
import { zem } from "$lib/utils.js";
import { CommandConfigPutSchema, SnowflakeSchema } from "$v1Api/assertions.js";
import { json } from "@sveltejs/kit";
import type { QueryFilter } from "mongoose";
import { inspect } from "util";

/**
 * Validates the "path" and "id" query parameters from the URL. XORs them.
 * Returns an object containing either the validated parameters or an error response.
 */
const pathValidator = (url: URL) => {
  const cmdPath = url.searchParams.get("path");
  if (cmdPath && !CommandpathRegex.test(cmdPath)) {
    console.log("Invalid command path format:", cmdPath);
    return { error: JsonErrors.badRequest("Invalid command path format") };
  }
  const idParam = url.searchParams.get("id");
  if (idParam && !SnowflakeSchema.safeParse(idParam).success) {
    return { error: JsonErrors.badRequest("Invalid command configuration ID format") };
  }
  if (!cmdPath && !idParam) {
    return { error: JsonErrors.badRequest("Either path or id query parameter must be provided") };
  }
  // "XOR" logic: path takes precedence over id
  return { path: cmdPath || null, id: !!cmdPath && idParam ? idParam : null };
};

// only this endpoint allows for partial matching because we wanna get all configs + subcommands for a "blacklist" for example
export async function GET({ params, url }) {
  const pathRes = pathValidator(url);
  if (pathRes.error) {
    return pathRes.error;
  }

  const filter: QueryFilter<ICommandConfig> = {
    guildId: params.guildid,
  };
  if (pathRes.path) {
    filter.commandPath = { $regex: `^${pathRes.path}`, $options: "i" };
  } else if (pathRes.id) {
    filter.id = pathRes.id;
  }
  const cfgs = await CommandConfig.find(filter);

  if (!cfgs || cfgs.length === 0) {
    return JsonErrors.notFound("Command configuration not found");
  }

  return json(cfgs.map((c) => FlattenDocToJSON(c)).map(FlattenBigIntFields));
}

export async function PUT({ request, params, url }) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return JsonErrors.badRequest("Invalid JSON body");
  }

  const valRes = new ZodValidator(
    CommandConfigPutSchema.refine(
      (datas) => datas.every((data) => data.guildId === params.guildid),
      zem("guildId and id must match URL parameters"),
    ),
  ).validate(body);
  if (!valRes.success) {
    console.debug("Validation error:", valRes.error);
    return JsonErrors.badRequest(valRes.error.message);
  }

  const updateQueries = valRes.data.map((data) => {
    const filter: QueryFilter<ICommandConfig> = {
      guildId: params.guildid,
      commandPath: data.commandPath,
    };
    if (data.id) {
      filter.id = data.id;
    }
    return {
      updateOne: {
        filter,
        update: data,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    };
  });

  await CommandConfig.bulkWrite(updateQueries);
  // bulkWrite does not return updated/upserted documents, so we need to fetch them again
  const updatedCfgs = await CommandConfig.find({
    guildId: params.guildid,
    commandPath: { $in: valRes.data.map((d) => d.commandPath) },
  });

  return json(updatedCfgs.map((c) => FlattenDocToJSON(c)).map(FlattenBigIntFields));
}

export async function DELETE({ params, url }) {
  const pathRes = pathValidator(url);
  if (pathRes.error) {
    return pathRes.error;
  }

  const filter: QueryFilter<ICommandConfig> = {
    guildId: params.guildid,
  };
  if (pathRes.path) {
    filter.commandPath = { $regex: `^${pathRes.path}`, $options: "i" };
  } else if (pathRes.id) {
    filter.id = pathRes.id;
  }
  const idParam = url.searchParams.get("id");
  if (SnowflakeSchema.safeParse(idParam).success) {
    filter.id = idParam;
  }
  try {
    await CommandConfig.deleteMany(filter);
    return json({ success: true });
  } catch (err: any) {
    console.error("Error deleting command configuration:", err);
    return JsonErrors.serverError(err.message || "Failed to delete command configuration");
  }
}
