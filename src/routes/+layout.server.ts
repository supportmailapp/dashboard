import { getUserGuilds } from "$lib/cache/guilds";

export const load = async ({ locals }) => {
  const data = {
    ccDate: "2025",
  };

  if (!locals.user) return data;

  return {
    ...data,
    user: locals.user,
    guilds: getUserGuilds(locals.user.id),
  };
};
