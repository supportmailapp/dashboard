import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getUserGuilds } from "$lib/cache/guilds";
import { decodeToken } from "$lib/server/auth";
import { Guild } from "$lib/classes/guilds";

export const prerender = false;

export const load: PageServerLoad = async ({ params, locals }) => {
  console.log("guild page load", params.slug);
  console.log("locals", locals);
  if (!locals.user || !params.slug.match(/^\d+$/)) {
    redirect(303, "/");
  }

  let aToken: string | undefined;
  if (locals.eToken) {
    const tokenData = decodeToken(locals.eToken, true);
    if (tokenData) {
      aToken = tokenData.access_token;
    }
  }

  let guilds = locals.guilds;
  if (!guilds && aToken) {
    const guildsResult = getUserGuilds(locals.user.id, aToken);
    if (guildsResult) {
      guilds = guildsResult.guilds.map((g) => Guild.from(g, guildsResult.configured.includes(g.id)));
    }
  }

  return {
    user: locals.user,
    guilds: guilds,
    guild: locals.guild || null,
    guildId: params.slug,
  };
};
