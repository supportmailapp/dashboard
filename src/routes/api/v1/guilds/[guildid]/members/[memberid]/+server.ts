import { getMember, setMember } from "$lib/cache/members.js";
import { ErrorResponses } from "$lib/constants.js";
import { DiscordREST } from "$lib/discord/utils.js";
import { type APIGuildMember } from "discord-api-types/v10";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";

const rest = new DiscordREST();
// We also have our own ratelimiter for this endpoint, because it deals with very sensitive data
// and we don't want to spam the API with requests for it.
const limiter = new RateLimiterMemory({
  blockDuration: 20,
  points: 5,
  duration: 15,
  keyPrefix: "guildmember",
});

/**
 *
 * @param x
 * @returns
 */
function getBlockDuration(x: number) {
  return 0.02 * x ** 2;
}

/**
 * @returns true if the request was allowed, false if it was rate limited
 */
async function checkRateLimit(
  guildId: string,
  memberId: string,
): Promise<{
  allowed: boolean;
  retryAfter?: number;
}> {
  try {
    const stats = await limiter.get(`${guildId}:${memberId}`);
    await limiter.consume(`${guildId}:${memberId}`, 1, {
      blockDuration: getBlockDuration((stats?.consumedPoints || 0) + 1),
    });
    return {
      allowed: true,
    };
  } catch (err: any) {
    if (err instanceof RateLimiterRes) {
      console.error("Rate limit error", err);
      return {
        allowed: false,
        retryAfter: err.msBeforeNext / 1000,
      };
    }
    return {
      allowed: false, // Should never happen
    };
  }
}

function apiMemberToPartial(member: APIGuildMember): PartialGuildMember {
  return {
    id: member.user.id,
    username: member.user.username,
    displayName: member.user.global_name ?? member.user.username,
    nick: member.nick ?? null,
    avatar: member.user.avatar,
    guildAvatar: member.avatar ?? null,
  };
}

export async function GET({ params: { memberid }, locals: { guildId } }) {
  let member = getMember(guildId, memberid);
  if (!member) {
    const decision = await checkRateLimit(guildId, memberid);
    if (!decision.allowed) return ErrorResponses.tooManyRequests(decision.retryAfter || 10);
    member = await rest.getGuildMember(guildId, memberid);
    if (!member) {
      return new Response(null, {
        status: 404,
        statusText: "Member not found",
      });
    }
    setMember(guildId, member);
  }

  return Response.json(apiMemberToPartial(member), {
    status: 200,
    statusText: "OK",
  });
}
