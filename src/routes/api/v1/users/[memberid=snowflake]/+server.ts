import { JsonErrors } from "$lib/constants.js";
import memberCache from "$lib/server/caches/members.js";
import { SnowflakePredicate } from "$lib/server/validators/index.js";
import * as Sentry from "@sentry/sveltekit";
import type { APIGuildMember } from "discord-api-types/v10";

export async function GET({ url, locals, params }) {
  const guildId = locals.guildId;
  if (!locals.isAuthenticated() || !guildId) return JsonErrors.badRequest();

  const filter = url.searchParams.get("filter");
  const memberId = params.memberid;

  // Only allow snowflakes
  const isSnowflake = SnowflakePredicate.safeParse(memberId).success;
  if (!isSnowflake) {
    return JsonErrors.badRequest("Search query must be a valid snowflake ID.");
  }

  // Helper function for error handling
  const handleDiscordError = (error: any) => {
    Sentry.captureException(error, {
      tags: { guildId, memberId },
    });
  };

  let members: APIGuildMember[] = [];

  // Check cache first
  const cached = memberCache.get(guildId, memberId);

  if (cached) {
    members = [cached];
  } else {
    // Fetch from Discord API
    const res = await locals.discordRest.getGuildMember(guildId, memberId);
    if (res.isSuccess()) {
      members = [res.data];
      memberCache.set(guildId, res.data.user.id, res.data);
    } else {
      handleDiscordError(res.error);
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
