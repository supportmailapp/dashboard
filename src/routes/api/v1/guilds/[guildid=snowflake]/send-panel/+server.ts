import { JsonErrors } from "$lib/constants.js";
import {
  getGuildChannel,
  getGuildChannels,
  isNonExistingChannel,
  setChannelCache,
  setNonExistingChannel,
} from "$lib/server/caches/guilds.js";
import { DBTag, TicketCategory } from "$lib/server/db/index.js";
import { ComponentParser } from "$lib/utils/formatting.js";
import { json } from "@sveltejs/kit";
import {
  ChannelType,
  MessageFlags,
  RESTJSONErrorCodes,
  type APIMessage as DCMessage,
  type RESTPostAPIChannelMessageJSONBody,
} from "discord-api-types/v10";
import userCache from "$lib/server/caches/userGuilds.js";
import { BurstyRateLimiter, RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import equal from "fast-deep-equal";
import { ZodValidator } from "$lib/server/validators/index.js";
import { PanelSchema } from "$v1Api/assertions.js";
import clientApi from "$lib/server/utils/clientApi";
import { inspect } from "util";

const ratelimiter = new BurstyRateLimiter(
  // 2 requests every 5 seconds with a burst of 20 requests per minute
  new RateLimiterMemory({
    points: 2,
    duration: 5,
    blockDuration: 10,
  }),
  new RateLimiterMemory({
    keyPrefix: "burst_server_send_message",
    points: 20, // 20 points
    duration: 60,
    blockDuration: 30,
  }),
);

// This endpoint is special, it doesn't require any payload
export async function POST({ request, params, locals, setHeaders }) {
  if (!locals.user) return JsonErrors.unauthorized();

  const body = await request.json().catch(() => null);
  if (!body) return JsonErrors.badRequest("Invalid JSON body");

  const valRes = new ZodValidator(PanelSchema).validate(body);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.toString());
  }

  const { channelId, messageId, data, allowedMentions } = valRes.data;
  const guildId = params.guildid;

  if (!channelId) {
    return JsonErrors.badRequest("Channel is required");
  }

  // Ratelimit per user per message
  try {
    const rateRes = await ratelimiter.consume(`${locals.user.id}:${guildId}`, 1);
    setHeaders({
      "X-RateLimit-Limit": String(rateRes?.remainingPoints ?? 0),
      "X-RateLimit-Remaining": String(rateRes?.remainingPoints ?? 0),
      "X-RateLimit-Reset": String(Date.now() + (rateRes?.msBeforeNext ?? 0)),
    });
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      setHeaders({
        "Retry-After": String(Math.ceil(err.msBeforeNext / 1000)),
        "X-RateLimit-Limit": String(err?.remainingPoints ?? 0),
        "X-RateLimit-Remaining": String(err?.remainingPoints ?? 0),
        "X-RateLimit-Reset": String(Date.now() + (err?.msBeforeNext ?? 0)),
      });
      return JsonErrors.tooManyRequests(`Try again in ${Math.ceil(err.msBeforeNext / 1000)} seconds`);
    }
    return JsonErrors.serverError("You are being rate limited, please try again later.");
  }

  // Check if channel ID exists in server and if its sendable (not category, voice, forum)
  let channel =
    getGuildChannels(guildId)?.find((c) => c.id === channelId) ?? getGuildChannel(guildId, channelId);
  if (!channel && !isNonExistingChannel(guildId, channelId)) {
    const apiChannel = await locals.discordRest.getGuildChannel(channelId);
    if (apiChannel.isSuccess()) {
      const channelData = apiChannel.data;

      // Check if channel type is sendable
      const sendableChannelTypes = [
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
        ChannelType.AnnouncementThread,
        ChannelType.PublicThread,
        ChannelType.PrivateThread,
      ];

      if (!sendableChannelTypes.includes(channelData.type)) {
        setNonExistingChannel(guildId, channelId);
        return JsonErrors.badRequest("Channel type is not sendable");
      }

      // Check if channel belongs to the correct guild
      if (
        !(channelData as GuildCoreChannel).guild_id ||
        (channelData as GuildCoreChannel).guild_id !== guildId
      ) {
        setNonExistingChannel(guildId, channelId);
        return JsonErrors.notFound("Channel not found in guild");
      }

      // Channel is valid, cache it and proceed
      setChannelCache(guildId, channelData as GuildCoreChannel);
      channel = channelData as GuildCoreChannel;
    } else {
      setNonExistingChannel(guildId, channelId);
      return JsonErrors.notFound("Channel not found");
    }
  } else if (!channel) {
    return JsonErrors.notFound("Channel not found in guild");
  } else if (
    channel.type === ChannelType.GuildCategory ||
    channel.type === ChannelType.GuildVoice ||
    channel.type === ChannelType.GuildStageVoice ||
    channel.type === ChannelType.GuildForum ||
    // @ts-expect-error - Type is not intended to be on channel, but just in case
    channel.type === ChannelType.GuildDirectory ||
    channel.type === ChannelType.GuildMedia
  ) {
    return JsonErrors.badRequest("Channel is not sendable");
  }

  const categoryDocs = await TicketCategory.find({ guildId }, { _id: 1 });
  const cats = categoryDocs.map((d) => d._id.toString());
  const tagDocs = await DBTag.find({ guildId }, { _id: 1 });
  const tags = tagDocs.map((d) => d._id.toString());

  const guild = userCache.getUserGuilds(locals.user.id)?.find((g) => g.id === guildId);
  if (!guild) return JsonErrors.forbidden("User is not in guild");

  const parsed = new ComponentParser(data as any, {
    categories: cats,
    tags: tags,
  }).parse();

  const payload: RESTPostAPIChannelMessageJSONBody = {
    flags: MessageFlags.IsComponentsV2,
    components: parsed,
    allowed_mentions: allowedMentions ?? {
      parse: [],
    },
  };

  // validate allowed mentions
  if (
    !equal(payload.allowed_mentions, { parse: [] }) &&
    payload.allowed_mentions &&
    Object.keys(payload.allowed_mentions).length > 0
  ) {
    // Message will fail if any role in allowed_mentions.roles has "allow anyone to mention" permission off and bot doesn't have permission to mention any role and everyone
    const res = await clientApi.post(`check-mention-permissions/${guildId}/${channelId}`, {
      json: {
        roles: payload.allowed_mentions?.roles ?? [],
      },
    });

    if (!res.ok) {
      // field: error
      const data = (await res.json()) as { error: string };
      return JsonErrors.badRequest(`Allowed Mentions validation failed: ${data.error}`);
    }
    const data = (await res.json()) as { valid: boolean; invalidRoles?: string[] };
    if (!data.valid) {
      // do not throw error, just remove invalid roles so we can send the message without failing
      payload.allowed_mentions.roles = (payload.allowed_mentions.roles || []).filter(
        (r) => !data.invalidRoles?.includes(r),
      );
    }
  }

  let apiMessage: DCMessage | null = null;
  if (!!messageId) {
    const res = await locals.discordRest.editMessage(channelId, messageId, payload);
    if (!res.isSuccess()) {
      return JsonErrors.serverError(res.errorToString());
    }
    apiMessage = res.data;
  } else {
    const res = await locals.discordRest.sendMessage(channelId, payload);
    if (!res.isSuccess()) {
      if (res.hasDiscordAPIError() && res.error.code === RESTJSONErrorCodes.InvalidFormBodyOrContentType) {
        if (res.error.message.includes("COMPONENT_CUSTOM_ID_DUPLICATED")) {
          return JsonErrors.badRequest(
            "Multiple buttons have the same category (or no category). Make sure all buttons are unique.",
          );
        }
      }
      return JsonErrors.serverError(res.errorToString());
    }
    apiMessage = res.data;
  }

  return json({ message: apiMessage });
}
