import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getUserGuilds } from "$lib/cache/guilds";
import { decodeToken } from "$lib/server/auth";

export const prerender = false;

export const load: PageServerLoad = async ({ params, locals }) => {
  console.log("guild page load", params.slug);
  console.log("locals", locals);
  if (!locals.user || !locals.guilds || !params.slug.match(/^\d+$/)) {
    return {};
  }

  let aToken: string | undefined;
  if (locals.eToken) {
    const tokenData = decodeToken(locals.eToken, true);
    if (tokenData) {
      aToken = tokenData.access_token;
    }
  }

  return {
    user: locals.user,
    guilds: locals.guilds || (locals.user && aToken ? getUserGuilds(locals.user.id, aToken) : null),
    guild: locals.guild || null,
    guildId: params.slug,
  };
};
