import { cacheDiscordUser } from "$lib/cache/users.js";
import { ErrorResponses } from "$lib/constants.js";
import { DiscordREST } from "$lib/discord/utils";
import { getCachedUser } from "$lib/stores/users.svelte.js";
import { anyUserToBasic } from "$lib/utils/formatting.js";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";

const rest = new DiscordREST();

const limiter = new RateLimiterMemory({
  blockDuration: 20,
  points: 5,
  duration: 15,
  keyPrefix: "guildmember_search",
});

function getBlockDuration(x: number) {
  return 0.02 * x ** 2;
}

async function checkRateLimit(
  guildId: string,
  userId: string,
): Promise<{
  allowed: boolean;
  retryAfter?: number;
}> {
  try {
    const key = `${guildId}:${userId}`;
    const stats = await limiter.get(key);
    await limiter.consume(key, 1, {
      blockDuration: getBlockDuration((stats?.consumedPoints || 0) + 1),
    });
    return {
      allowed: true,
    };
  } catch (err: any) {
    if (err instanceof RateLimiterRes) {
      console.error("Rate limit error for search", err);
      return {
        allowed: false,
        retryAfter: err.msBeforeNext / 1000,
      };
    }
    console.error("Unexpected error in rate limiter:", err);
    return {
      allowed: false,
    };
  }
}

export async function GET({ url, locals }) {
  if (!locals.userId) {
    return ErrorResponses.unauthorized();
  }

  const rateLimitDecision = await checkRateLimit(locals.guildId, locals.userId);
  if (!rateLimitDecision.allowed) {
    return ErrorResponses.tooManyRequests(rateLimitDecision.retryAfter || 10);
  }

  const queryParams = url.searchParams;
  if (!queryParams.has("query")) {
    return ErrorResponses.badRequest("Missing query parameter 'query'.");
  }

  const query = queryParams.get("query") as string;

  // TODO: First check if query is a user ID, if so check cache - if not found, then fetch from Discord
  // TODO: Tet if and how an error is thrown if the user is not found while fetching from Discord
  // TODO: merge this file with [memberid] route and rename route to [slug]
  let user: BasicUser | null = null;
  if (/^\d+$/.test(query)) {
    user = getCachedUser(query);
    if (user) {
      return Response.json([user]);
    }
    const getMemberRes = await rest.getGuildMember(locals.guildId, query);
    if (getMemberRes) {
      cacheDiscordUser(getMemberRes.user);
      user = anyUserToBasic(getMemberRes.user)!;
      return Response.json([user]);
    }
    return ErrorResponses.notFound("User not found by ID.");
  }

  const res = await rest.searchGuildMembers(locals.guildId, query, 100);
  const basicUsers = res.map((member) => {
    cacheDiscordUser(member.user);
    return anyUserToBasic(member.user);
  });
  return Response.json(basicUsers);
}
