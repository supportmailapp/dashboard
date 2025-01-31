import { env } from "$env/dynamic/private";
import { urls } from "$lib/constants";
import { error, redirect } from "@sveltejs/kit";
import type { APIRole } from "discord-api-types/v10";
import { Routes } from "discord-api-types/v10";
import type { PageServerLoad } from "./$types";
import { Guild } from "$lib/classes/guilds";

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  console.log("guild page load", params.slug);
  console.log("locals", locals);
  if (!locals.user || !locals.guilds || !params.slug.match(/^\d+$/)) {
    return redirect(303, "/");
  }

  const currentGuild = locals.guilds.find((g) => g.id === params.slug);
  if (!currentGuild) {
    return redirect(303, "/");
  }

  locals.guild = currentGuild;

  return {
    user: locals.user,
    guilds: locals.guilds,
    guild: locals.guild,
  };
};
