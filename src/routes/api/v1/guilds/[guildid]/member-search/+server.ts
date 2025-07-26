import { JsonErrors } from "$lib/constants.js";
import userCache from "$lib/server/caches/users.js";
import { SnowflakePredicate } from "$lib/server/validators/index.js";
import * as Sentry from "@sentry/sveltekit";
import type { APIGuildMember, APIUser } from "discord-api-types/v10";

export async function GET({ url, locals }) {
  const guildId = locals.guildId;
  if (!locals.isAuthenticated() || !guildId) return JsonErrors.badRequest();

  const searchQuery = url.searchParams.get("q");
  const filter = url.searchParams.get("filter");

  if (!searchQuery) {
    return JsonErrors.badRequest("Missing search query parameter 'q'.");
  }

  // Helper function for error handling
  const handleDiscordError = (error: any) => {
    Sentry.captureException(error, {
      tags: { guildId, searchQuery },
    });
  };

  let users: APIUser[] = [];

  // Check cache first
  const isSnowflake = SnowflakePredicate.safeParse(searchQuery).success;
  const cached = userCache.get(guildId, searchQuery);

  if (cached) {
    users = Array.isArray(cached) ? cached : [cached];
  } else {
    // Fetch from Discord API
    if (isSnowflake) {
      const res = await locals.discordRest.getGuildMember(guildId, searchQuery);
      if (res.isSuccess()) {
        users = [res.data.user];
        userCache.set(guildId, res.data.user.id, users);
      } else {
        handleDiscordError(res.error);
      }
    } else {
      const res = await locals.discordRest.searchServerMembers(guildId, searchQuery, 10);
      if (res.isSuccess()) {
        users = res.data.map((member: APIGuildMember) => member.user);
        userCache.set(guildId, searchQuery, users);
      } else {
        handleDiscordError(res.error);
      }
    }
  }

  // Apply filter if specified and members exist
  if (filter && users.length > 0) {
    switch (filter) {
      case "bot":
        users = users.filter((user) => !!user.bot);
        break;
    }
  }

  return Response.json(users);
}
