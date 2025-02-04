import { redirect } from "@sveltejs/kit";

export const load = async ({ locals }) => {
  if (!locals.user) redirect(302, "/?logout=true");

  return {
    user: locals.user,
  };
};
