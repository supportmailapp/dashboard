import { JsonErrors } from "$lib/constants";
import { getGuildChannels, getGuildRoles } from "$lib/server/caches/guilds.js";
import userGuilds from "$lib/server/caches/userGuilds.js";
import { ClientApiRoutes, SMErrorCodes } from "$lib/server/constants";
import clientApi from "$lib/server/utils/clientApi.js";
import { ZodValidator } from "$lib/server/validators/index.js";
import { canManageBot } from "$lib/server/permissions.js";
import { json } from "@sveltejs/kit";
import type { KyResponse } from "ky";
import z from "zod";

const routePredicate = z.object({
  categoryId: z
    .string()
    .regex(/^\d+$/, { error: "Malformed categoryId snowflake" })
    .optional(),
});

export async function POST({ locals, request, params }) {
  if (!locals.token || !locals.user) return JsonErrors.unauthorized();

  const guildId = params.guildid;

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

  const _body = await request.json().catch(() => null);

  const valRes = new ZodValidator(routePredicate).validate(_body);

  if (!valRes.success) {
    return JsonErrors.badRequest(String(valRes.error.message ?? valRes.error));
  }

  const { categoryId } = valRes.data;

  // Validate category presence
  if (categoryId) {
    let guildChannels = getGuildChannels(guildId);
    if (guildChannels === undefined) {
      const channelsRes = await locals.discordRest.getGuildChannels(guildId);
      if (channelsRes.isSuccess()) {
        guildChannels = channelsRes.data;
      }

      if (!guildChannels) {
        return JsonErrors.serverError("Could not determine roles");
      }
    }

    if (!guildChannels.some((c) => c.id === categoryId)) {
      return JsonErrors.notFound("Category not found in guild");
    }
  }

  const res = await clientApi
    .post<ClientAPI.POSTTicketSetupJSONResult>(ClientApiRoutes.ticketSetup(), {
      json: {
        userId: locals.user.id,
        guildId: guildId,
        categoryId: categoryId,
      },
    })
    .catch(
      () =>
        ({
          ok: false,
          status: 500,
          statusText: "Internal Error",
        }) as KyResponse<ClientAPI.POSTTicketSetupJSONResult>,
    );

  if (!res.ok) {
    // This only happens on 500 errors
    return new Response(null, { status: res.status, statusText: res.statusText });
  }

  const jsonRes = await res.json();

  if (!jsonRes.success) {
    switch (jsonRes.error.code ?? 500) {
      case SMErrorCodes.MissingPermissions:
        return JsonErrors.forbidden("Bot missing required permissions");
      case SMErrorCodes.CategoryNotFound:
        return JsonErrors.notFound("Category not found");
      case SMErrorCodes.CategoryCreationFailed:
        return JsonErrors.serverError("Failed to create category");
      case SMErrorCodes.ForumCreationFailed:
        return JsonErrors.serverError("Failed to create forum channel");
      case SMErrorCodes.CommunityRequired:
        return JsonErrors.badRequest("Server must be a community server");
      default:
        return JsonErrors.serverError("Setup failed");
    }
  }

  return json(jsonRes.data);
}
