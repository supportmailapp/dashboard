import { validateSearchParams } from "runed/kit";
import { searchParamsSchema, type ConfigKey } from "./+page.svelte";
import {
  BlacklistEntry,
  CommandConfig,
  DBGuild,
  DBTag,
  FeedbackConfig,
  FlattenBigIntFields,
  FlattenDateFields,
  FlattenDocToJSON,
  logThis,
  Panel,
  TicketCategory,
} from "$lib/server/db/index.js";
import * as Sentry from "@sentry/sveltekit";
import { LogEventType } from "$lib/sm-types/src";
import { error } from "@sveltejs/kit";

export async function load({ url, locals }) {
  if (!locals.user) {
    error(401, "Unauthorized");
  }
  const { data } = validateSearchParams(url, searchParamsSchema);
  if (data.guild && !/^\d+$/.test(data.guild)) {
    return {
      status: 400,
      error: "Invalid guild ID. It must be a numeric string.",
    };
  }

  let guildId = data.guild;
  const selected = new Set(data.selected);
  const configData: Partial<Record<ConfigKey, any>> = {};

  if (!guildId) {
    return {
      status: 200,
      configs: configData,
    };
  }

  Sentry.metrics.count("config_viewer_load", 1, {
    attributes: {
      selected: Array.from(selected).join(",") || "none",
      user_id: locals.user?.id,
    },
  });
  await logThis({
    typ: LogEventType.InternalConfigLoad,
    guildId: guildId,
    extra: {
      keys: Array.from(selected).join(",") || "none",
      userId: locals.user?.id,
    },
  });

  if (!selected.size) {
    return {
      status: 200,
      configs: configData,
    };
  }

  if (selected.has("blacklist")) {
    configData.blacklist = await BlacklistEntry.find({ guildId: guildId });
  }
  if (selected.has("ticketCategories")) {
    configData.ticketCategories = await TicketCategory.find({ guildId: guildId });
  }
  if (selected.has("commandConfig")) {
    configData.commandConfig = await CommandConfig.find({ guildId: guildId });
  }
  if (selected.has("feedback")) {
    configData.feedback = await FeedbackConfig.findOne({ guildId: guildId });
  }
  if (selected.has("guild")) {
    configData.guild = await DBGuild.findOne({ id: guildId });
  }
  if (selected.has("panel")) {
    configData.panel = await Panel.findOne({ guildId: guildId });
  }
  if (selected.has("tags")) {
    configData.tags = await DBTag.find({ guildId: guildId });
  }

  return {
    status: 200,
    configs: Object.keys(configData).reduce(
      (acc, key) => {
        const value = configData[key as ConfigKey];
        if (value) {
          acc[key as ConfigKey] = Array.isArray(value)
            ? value.map((d) => fullyFlattenDocToJSON(d))
            : (fullyFlattenDocToJSON(value) ?? null);
        }
        return acc;
      },
      {} as Partial<Record<ConfigKey, any>>,
    ),
  };
}

function fullyFlattenDocToJSON(doc: any) {
  // FlattenDateFields, FlattenBigIntFields, FlattenDocToJSON all in one
  if (doc === null || doc === undefined) {
    return doc;
  }
  const dateFields = Object.keys(doc).filter((key) => doc[key] instanceof Date);
  let flattened = FlattenDocToJSON(doc, true);
  flattened = FlattenBigIntFields(flattened);
  return FlattenDateFields(flattened, ...dateFields);
}
