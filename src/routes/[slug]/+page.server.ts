import { env } from "$env/dynamic/private";
import { urls } from "$lib/constants";
import { apiGuildToActiveGuild } from "$lib/utils/formatting";
import { error, redirect } from "@sveltejs/kit";
import type { APIRole } from "discord-api-types/v10";
import { Routes } from "discord-api-types/v10";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  console.log("guild page load", params.slug);
  console.log("locals", locals);
  if (!locals.user || !locals.guilds || !params.slug.match(/^\d+$/)) {
    return redirect(303, "/");
  }

  const partialGuild = locals.guilds.find((g) => g.id === params.slug);
  if (!partialGuild) {
    return redirect(303, "/");
  }

  try {
    const [channelsRes, rolesRes] = await Promise.all([
      fetch(urls.discordBase + Routes.guildChannels(partialGuild.id), {
        headers: {
          Authorization: `Bot ${env.discordBotToken}`,
          "content-type": "application/json",
        },
      }),
      fetch(urls.discordBase + Routes.guildRoles(partialGuild.id), {
        headers: {
          Authorization: `Bot ${env.discordBotToken}`,
          "content-type": "application/json",
        },
      }),
    ]);

    if (!channelsRes.ok || !rolesRes.ok) {
      throw {
        status: Math.max(channelsRes.status, rolesRes.status),
        message: `${channelsRes.statusText}, ${rolesRes.statusText}`,
      };
    }

    const apiChannels = (await channelsRes.json()) as APIGuildCoreChannel[];
    const apiRoles = (await rolesRes.json()) as APIRole[];

    if (!apiChannels || !apiRoles) {
      throw { status: 500, message: "Failed to fetch data from Discord API." };
    }

    locals.guild = apiGuildToActiveGuild(partialGuild, apiChannels, apiRoles);

    return {
      user: locals.user,
      guilds: locals.guilds,
      guild: locals.guild,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Failed to fetch")) {
      error(500, {
        message: "Error fetching data from Discord API.",
        status: 500,
        details: err.message,
      });
    } else {
      error(500, {
        message: "An unexpected error occurred.",
        status: 500,
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
};
