import { JsonErrors } from "$lib/constants";
import { getGuildRoles } from "$lib/server/caches/guilds.js";
import userGuilds from "$lib/server/caches/userGuilds.js";
import { getDBGuild, updateDBGuild } from "$lib/server/db/utils.js";
import { hasAllKeys } from "$lib/utils";
import { canManageBot } from "$lib/utils/permissions.js";
import type { APIGuildForumChannel, APIGuildForumTag } from "discord-api-types/v10";
import type { IFeedbackTags } from "supportmail-types";

export async function POST({ locals }) {
  if (!locals.token || !locals.user) return JsonErrors.unauthorized();

  const guildId = locals.guildId!;

  const _guild = userGuilds.getUserGuilds(locals.user.id)?.find((g) => g.id === guildId);
  let hasPerms = false;
  if (_guild) {
    hasPerms = canManageBot(_guild.permissions);
  } else {
    const memberRes = await locals.discordUserRest!.getCurrentUserGuildMember(guildId);
    if (memberRes.isSuccess()) {
      let guildRoles = getGuildRoles(guildId) ?? null;

      if (guildRoles === null) {
        const rolesRes = await locals.discordRest.getGuildRoles(guildId);
        if (rolesRes.isSuccess()) {
          guildRoles = rolesRes.data;
        }
      }

      if (!guildRoles) {
        return JsonErrors.serverError("Could not determine roles");
      }

      hasPerms = memberRes.data.roles.some((roleId) => {
        const role = guildRoles.find((r) => r.id === roleId);
        return role && canManageBot(role.permissions);
      });
    }
  }

  if (!hasPerms) {
    return JsonErrors.forbidden("Insufficient Permissions");
  }

  const dbGuild = await getDBGuild(guildId, "full");
  if (!dbGuild) {
    return JsonErrors.notFound("Config not found");
  }
  const { ticketConfig } = dbGuild;

  if (!ticketConfig.forumId) {
    return JsonErrors.badRequest("Ticket setup not completed");
  }

  const allTagKeys: ("one" | "two" | "three" | "four" | "five")[] = ["one", "two", "three", "four", "five"];
  const missingTags: typeof allTagKeys = [];

  if (
    ticketConfig.feedback?.tags &&
    !hasAllKeys(ticketConfig.feedback.tags, ["one", "two", "three", "four", "five"])
  ) {
    for (const key of allTagKeys) {
      if (!(key in ticketConfig.feedback.tags)) {
        missingTags.push(key);
      }
    }
  } else {
    missingTags.push(...allTagKeys);
  }

  // TODO: Add missingTags functionality for edit channel stuff
  if (missingTags.length > 0) {
    console.log(`[DEBUG] Setting up feedback tags for guild ${guildId}, missing tags:`, missingTags);

    // Update the forum's tags with the missing ones
    let forumGetRes = await locals.discordRest.getGuildChannel<APIGuildForumChannel>(ticketConfig.forumId);

    if (!forumGetRes.isSuccess()) {
      if (forumGetRes.status === 404) {
        return JsonErrors.notFound("Forum channel not found");
      }
      return JsonErrors.serverError(forumGetRes.errorToString());
    }

    let forum = forumGetRes.data;
    const currentTags: APIGuildForumTag[] = forum?.available_tags ?? [];
    console.log(`[DEBUG] Current forum tags count: ${currentTags.length}`);

    const newTags = {
      one: { name: "1 ⭐", moderated: true },
      two: { name: "2 ⭐", moderated: true },
      three: { name: "3 ⭐", moderated: true },
      four: { name: "4 ⭐", moderated: true },
      five: { name: "5 ⭐", moderated: true },
    } as Record<"one" | "two" | "three" | "four" | "five", APIGuildForumTag>;
    const finalTags = currentTags.concat(Object.values(newTags));

    console.log(
      `[DEBUG] Creating ${Object.values(newTags).length} new tags, total tags will be: ${finalTags.length}`,
    );

    const forumRes = await locals.discordRest.editGuildChannel<APIGuildForumChannel>(ticketConfig.forumId, {
      available_tags: finalTags,
    });

    if (!forumRes.isSuccess()) {
      return JsonErrors.serverError(forumRes.errorToString());
    }

    forum = forumRes.data;
    console.log(`[DEBUG] Forum updated successfully, new tag count: ${forum.available_tags.length}`);

    // Wait because of reatelimits
    await new Promise((resolve) => setTimeout(resolve, 2_000));

    const feedbackTags = Object.entries(newTags).reduce((acc, [tagKey, { name }]) => {
      const tagId = forum.available_tags.find((t) => t.name === name)?.id;
      if (tagId) {
        acc[tagKey] = tagId;
      }
      return acc;
    }, {} as IFeedbackTags);

    console.log(`[DEBUG] Mapped feedback tags:`, feedbackTags);

    await updateDBGuild(guildId, {
      "ticketConfig.feedback.tags": feedbackTags,
    });

    console.log(`[DEBUG] Database updated successfully for guild ${guildId}`);
  } else {
    console.log(`[DEBUG] All feedback tags already exist for guild ${guildId}`);
  }

  return new Response(null, { status: 201 });
}
