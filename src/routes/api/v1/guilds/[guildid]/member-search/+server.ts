import { JsonErrors } from "$lib/constants.js";
import memberCache from "$lib/server/caches/members.js";
import { SnowflakePredicate } from "$lib/server/validators/index.js";
import * as Sentry from "@sentry/sveltekit";
import type { APIGuildMember } from "discord-api-types/v10";

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

  let members: APIGuildMember[] = [];

  // Check cache first
  const isSnowflake = SnowflakePredicate.safeParse(searchQuery).success;
  const cached = isSnowflake
    ? memberCache.get(guildId, searchQuery)
    : memberCache.getSearchResult(guildId, searchQuery);

  if (cached) {
    members = Array.isArray(cached) ? cached : [cached];
  } else {
    // Fetch from Discord API
    if (isSnowflake) {
      const res = await locals.discordRest.getGuildMember(guildId, searchQuery);
      if (res.isSuccess()) {
        members = [res.data];
        memberCache.set(guildId, res.data.user.id, res.data);
      } else {
        handleDiscordError(res.error);
      }
    } else {
      const res = await locals.discordRest.searchServerMembers(guildId, searchQuery, 10);
      if (res.isSuccess()) {
        members = res.data;
        memberCache.setSearchResult(guildId, searchQuery, res.data);
      } else {
        handleDiscordError(res.error);
      }
    }
  }

  // Apply filter if specified and members exist
  if (filter && members.length > 0) {
    switch (filter) {
      case "bot":
        members = members.filter((member) => !!member.user.bot);
        break;
    }
  }

  return Response.json(members);
}
