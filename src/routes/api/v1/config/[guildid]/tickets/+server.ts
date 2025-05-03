import { SchemaValidator } from "$lib";
import { ErrorResponses } from "$lib/constants.js";
import { DBGuild, updateGuild } from "$lib/server/db";
import type { ITicketConfig } from "supportmail-types";

/**
 * The type for the PATCH request body.
 *
 * It is a partial version of the ITicketConfig type, excluding some properties.\
 * Excluded properties are handled by a seperate route.
 */
type TicketConfigSchema = Omit<ITicketConfig, "closeMessage" | "creationMessage" | "feedback" | "tags">;

const configSchema = new SchemaValidator<TicketConfigSchema>({
  enabled: { type: "boolean", required: true },
  forumId: { type: ["string", "null"], required: true },
  anonym: {
    type: "object",
    properties: {
      enabled: { type: "boolean", required: true },
      user: { type: "boolean", required: true },
      alias: { type: "string", required: false },
    },
  },
  autoForwarding: { type: "boolean", required: true },
  allowedBots: { type: "array", required: false, items: { type: "string" } },
  pings: {
    type: "array",
    required: false,
    items: {
      type: "array",
      items: { type: "string" },
    },
  },
  pausedUntil: {
    type: ["object", "null"],
    required: false,
    properties: {
      value: { type: "boolean", required: true },
      date: { type: ["date", "null"], required: true },
    },
  },
});

export async function GET({ locals }) {
  if (locals.guildId && locals.token) {
    const guildId = locals.guildId;
    const guildConfig = await DBGuild.findOne({ id: guildId }, null, { lean: true });
    if (!guildConfig) {
      return Response.json("Guild not found", { status: 404, statusText: "Not Found" });
    }
    const ticketConfig = guildConfig.ticketConfig;
    const finalConfig = configSchema.validate(ticketConfig); // We don't need to validate the config, but it removes the extra properties...
    console.debug("Final config", finalConfig);
    return Response.json({
      ...finalConfig.value,
    });
  }

  return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
}

export async function PATCH({ request, locals }) {
  if (locals.guildId && locals.token) {
    const update = (await request.json()) as Record<string, any>;
    console.debug("Update", update);
    const result = configSchema.validate(update);

    if (!result.isValid || Object.entries(result.errors).length > 0) {
      console.debug("Validation errors", result.errors);
      return Response.json(result, { status: 400, statusText: "Bad Request" });
    }

    const currentConfig = await DBGuild.findOne({ id: locals.guildId }, null, { lean: true });

    if (!currentConfig) return ErrorResponses.notFound("Guild not found");

    // Initialize pings array to avoid null reference errors in later operations
    result.value.pings = result.value.pings ?? [];

    // Convert pings to string format for easier comparison when checking for duplicates
    const currentPings = currentConfig.ticketConfig.pings?.map((p) => p[0] + p[1]) ?? [];
    const newPings = result.value.pings?.map((p) => p[0] + p[1]) ?? [];

    // Use structuredClone to create a deep copy to avoid modifying the original array by reference
    const finalPings: ["@" | "@&", string][] = new Array().concat(currentConfig.ticketConfig.pings ?? []);

    // Helper function to check if a ping is unique to avoid duplicates in the database
    const newPingIsUnique = (ping: string) => !currentPings.includes(ping);

    // Filter out duplicates from the new pings and add them to the final pings array
    if (newPings.length > 0) {
      for (let i = 0; i < newPings.length; i++) {
        if (newPingIsUnique(newPings[i])) {
          finalPings.push(result.value.pings[i]);
        }
      }
    }

    const modifiedUpdate = Object.keys(result.value).reduce(
      (acc, key) => {
        acc[`ticketConfig.${key}`] = result.value[key as keyof TicketConfigSchema];
        return acc;
      },
      {} as Record<string, any>,
    );

    await updateGuild(locals.guildId, {
      $set: {
        ...modifiedUpdate,
      },
    });

    return new Response(null, { status: 204, statusText: "No Content" });
  }

  return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
}
