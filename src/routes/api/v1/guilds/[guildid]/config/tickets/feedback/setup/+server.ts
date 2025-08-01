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

    const allFeedbackTags = {
      one: { name: "1 ⭐", moderated: true },
      two: { name: "2 ⭐", moderated: true },
      three: { name: "3 ⭐", moderated: true },
      four: { name: "4 ⭐", moderated: true },
      five: { name: "5 ⭐", moderated: true },
    } as Record<"one" | "two" | "three" | "four" | "five", APIGuildForumTag>;

    // Filter out tags that already exist based on name (because tag names must be unique)
    const newTags = Object.fromEntries(
      Object.entries(allFeedbackTags).filter(
        ([_, tag]) => !currentTags.some((existingTag) => existingTag.name === tag.name),
      ),
    ) as Partial<typeof allFeedbackTags>;

    const finalTags = currentTags.concat(Object.values(newTags));

    if (finalTags.length > 25) {
      return JsonErrors.badRequest("Cannot have more than 25 tags in a forum channel");
    } else if (finalTags.length === 0) {
      return JsonErrors.badRequest("Cannot remove all tags from a forum channel");
    } else if (finalTags.length === currentTags.length) {
      console.log(`[DEBUG] No new tags to add for guild ${guildId}, skipping update.`);
      // Don't return early - we still need to update the DB with existing tag mappings
    } else {
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

      // Wait because of rate limits
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }

    // Map all feedback tags (both existing and new) to their IDs

    const feedbackTags = Object.entries(allFeedbackTags).reduce((acc, [tagKey, tagData]) => {
      const tagId = forum.available_tags.find((t) => t.name === tagData.name)?.id;
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

export async function DELETE({ locals }) {
  // Delete tags from the forum channel and the DB afterwards; disable feedback
  if (!locals.isAuthenticated() || !locals.guildId) return JsonErrors.unauthorized();

  const guildId = locals.guildId;
  const dbGuild = await getDBGuild(guildId, "full");
  if (!dbGuild || !dbGuild.ticketConfig.feedback || !dbGuild.ticketConfig.forumId) {
    return JsonErrors.notFound("Feedback configuration not found");
  }

  const forumId = dbGuild.ticketConfig.forumId;
  const forumGetRes = await locals.discordRest.getGuildChannel<APIGuildForumChannel>(forumId);
  if (!forumGetRes.isSuccess()) {
    if (forumGetRes.status === 404) {
      return JsonErrors.notFound("Forum channel not found");
    }
    return JsonErrors.serverError(forumGetRes.errorToString());
  }

  const forum = forumGetRes.data;
  const currentTags: APIGuildForumTag[] = forum.available_tags ?? [];
  const feedbackTags = dbGuild.ticketConfig.feedback.tags;
  if (!feedbackTags || Object.keys(feedbackTags).length === 0) {
    return JsonErrors.badRequest("No feedback tags to delete");
  }

  const tagsWithoutFeedback = currentTags.filter((tag) => {
    return !Object.values(feedbackTags).includes(tag.id);
  });

  if (tagsWithoutFeedback.length === currentTags.length) {
    return new Response(null, { status: 204 }); // No feedback tags to delete
  }

  const forumRes = await locals.discordRest.editGuildChannel<APIGuildForumChannel>(forumId, {
    available_tags: tagsWithoutFeedback,
  });

  if (!forumRes.isSuccess()) {
    return JsonErrors.serverError(forumRes.errorToString());
  }

  console.log(`[DEBUG] Forum updated successfully, new tag count: ${forumRes.data.available_tags.length}`);

  await updateDBGuild(guildId, {
    "ticketConfig.feedback.tags": {},
  });

  console.log(`[DEBUG] Database updated successfully for guild ${guildId}`);
  return new Response(null, { status: 204 });
}
