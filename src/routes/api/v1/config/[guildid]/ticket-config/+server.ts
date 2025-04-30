import { SchemaValidator } from "$lib";
import { DBGuild, updateGuild } from "$lib/server/db";
import type { ITicketConfig } from "supportmail-types";

/**
 * The type for the PATCH request body.
 *
 * It is a partial version of the ITicketConfig type, excluding some properties.\
 * Excluded properties are handled by a seperate route.
 */
type TicketConfigSchema = Omit<ITicketConfig, "closeMessage" | "creationMessage" | "feedback" | "pausedUntil" | "tags">;

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
    items: { type: "string" },
    customValidator: (arr) => {
      return arr.length == 2 && (arr[0] == "@" || arr[0] == "@&") && /\d{10,22}/.test(arr[1]);
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
    return Response.json({
      ...finalConfig.value,
      pings: [],
    });
  }

  return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
}

export async function PATCH({ request, locals }) {
  if (locals.guildId && locals.token) {
    const update = (await request.json()) as Record<string, any>;
    const result = configSchema.validate(update);
    if (!result.isValid || Object.entries(result.errors).length > 0) {
      console.debug("Validation errors", result.errors);
      return Response.json(result, { status: 400, statusText: "Bad Request" });
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
