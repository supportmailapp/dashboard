import { env } from "$env/dynamic/private";
import { cacheGuilds } from "$lib/cache/guilds.js";
import { baseForumTagEmojis } from "$lib/constants.js";
import { DiscordREST, fetchUserGuilds } from "$lib/discord/utils";
import { getGuild, updateGuild } from "$lib/server/db/utils.js";
import { canManageBot } from "$lib/utils/permissions.js";
import {
  ChannelType,
  ForumLayoutType,
  OverwriteType,
  RESTJSONErrorCodes,
  Routes,
  type APIGuildCategoryChannel,
  type APIGuildForumChannel,
  type RESTPostAPIGuildChannelJSONBody,
} from "discord-api-types/v10";
import { DiscordAPIError, PermissionsBitField } from "discord.js";

type SupportedLangs = "en" | "de" | "fr";

const Translations = {
  forumName: {
    en: "tickets",
    de: "tickets",
    fr: "tickets",
  },
  tags: {
    open: {
      en: "Open",
      de: "Offen",
      fr: "Ouvert",
    },
    closed: {
      en: "closed",
      de: "Geschlossen",
      fr: "Fermé",
    },
    unanswered: {
      en: "Unanswered",
      de: "Unbeantwortet",
      fr: "Sans réponse",
    },
    closeRequested: {
      en: "Close Requested",
      de: "Schließung angefragt",
      fr: "Fermeture demandée",
    },
    userResponded: {
      en: "User Responded",
      de: "Nutzer hat geantwortet",
      fr: "L'utilisateur a répondu",
    },
    awaitingResponse: {
      en: "Awaiting Response",
      de: "Wartet auf Antwort",
      fr: "En attente de réponse",
    },
  },
};

export async function POST({ locals, request }) {
  const guildId = locals.guildId!;
  const user = locals.user!;
  try {
    let guilds = await fetchUserGuilds(user.id, locals.token!, { bypassCache: true });
    if (!guilds) {
      return new Response(null, { status: 401, statusText: "Unauthorized" });
    } else {
      cacheGuilds(...guilds);
    }

    const guild = guilds.find((g) => g.id === guildId);
    if (!guild || !canManageBot(guild.permissions)) {
      return new Response(null, { status: 403, statusText: "Forbidden" });
    }

    // * Start setup * //

    const rest = new DiscordREST();
    const body = await request.json();
    let { categoryId = null } = body as { categoryId?: string };
    const guildConfig = (await getGuild(guildId))!;

    // Permission checks are a nightmare if we can't get general user permissions for a channel or the guild

    try {
      const category = (await rest.instance.post(Routes.guildChannels(guildId), {
        body: {
          name: Translations.forumName[guildConfig.lang as SupportedLangs],
          type: ChannelType.GuildCategory,
          position: 0,
          permissionOverwrites: [
            {
              id: guildId,
              type: OverwriteType.Role,
              allow: [PermissionsBitField.Flags.SendMessages],
              deny: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.ManageThreads,
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.CreatePublicThreads,
                PermissionsBitField.Flags.UseExternalEmojis,
              ],
            },
            {
              id: env.clientId,
              type: OverwriteType.Member,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.ManageThreads,
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.CreatePublicThreads,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.UseExternalEmojis,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
            {
              id: user.id,
              type: OverwriteType.Member,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.UseExternalEmojis,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ],
        } as RESTPostAPIGuildChannelJSONBody,
      })) as APIGuildCategoryChannel;

      categoryId = category.id;
    } catch (err: any) {
      if (err instanceof DiscordAPIError) {
        if (err.code === RESTJSONErrorCodes.MissingPermissions) {
          return Response.json(
            {
              error: "MissingPermissions",
              message: "The bot is missing permissions to create a category.",
            },
            { status: 403, statusText: "Forbidden" },
          );
        }
        return Response.json(
          {
            error: "DiscordAPIError",
            message: "An error occurred while creating the category.",
            code: err.code,
          },
          { status: 500, statusText: "Internal Server Error" },
        );
      }

      throw err;
    }
    // Category created

    let forum: APIGuildForumChannel;
    try {
      forum = (await rest.instance.post(Routes.guildChannels(guildId), {
        body: {
          name: Translations.forumName[guildConfig.lang as SupportedLangs],
          type: ChannelType.GuildForum,
          parent_id: categoryId,
          available_tags: Object.values(Translations.tags).map((value) => ({
            name: value[guildConfig.lang as SupportedLangs],
            moderated: true,
          })),
          topic: "SupportMail Tickets",
          default_forum_layout: ForumLayoutType.ListView,
          rate_limit_per_user: 2,
          default_thread_rate_limit_per_user: 2,
        } as RESTPostAPIGuildChannelJSONBody,
        reason: `Tickets Setup by @${locals.user?.username} (${user})`,
      })) as APIGuildForumChannel;
    } catch (err: any) {
      if (err instanceof DiscordAPIError) {
        if (err.code === RESTJSONErrorCodes.MissingPermissions) {
          return Response.json(
            {
              error: "MissingPermissions",
              message: "The bot is missing permissions to create a category.",
            },
            { status: 403, statusText: "Forbidden" },
          );
        }
        return Response.json(
          {
            error: "DiscordAPIError",
            message: "An error occurred while creating the category.",
            code: err.code,
          },
          { status: 500, statusText: "Internal Server Error" },
        );
      }

      throw err;
    }

    const tags = forum.available_tags || [];
    function findTagId(emojiName: string) {
      return tags.find((t) => t?.emoji_name === emojiName)?.id || null;
    }

    // update database
    await updateGuild(guildId, {
      $set: {
        "ticketConfig.enabled": true,
        "ticketConfig.forumId": forum.id,
        "ticketConfig.tags": tags
          ? {
              open: findTagId(baseForumTagEmojis.open),
              closed: findTagId(baseForumTagEmojis.closed),
              unanswered: findTagId(baseForumTagEmojis.unanswered),
              pendingQR: findTagId(baseForumTagEmojis.pendingQR),
              uResponded: findTagId(baseForumTagEmojis.uResponded),
              awaitingRes: findTagId(baseForumTagEmojis.awaitingRes),
            }
          : null,
      },
    });

    return new Response(null, { status: 201, statusText: "Created" });
  } catch (err: any) {
    console.error(err);
    return Response.json(err, { status: 500, statusText: "Internal Server Error" });
  }
}
