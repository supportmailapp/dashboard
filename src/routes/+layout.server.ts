import { user } from "$lib/stores/user.svelte";
import { redirect } from "@sveltejs/kit";

export const load = async ({ locals, params }) => {
  const data = {
    ccDate: "2025",
  };

  if (!locals.user) {
    if (!params.slug) return data;
    else redirect(303, "/");
  }

  return {
    ...data,
    user: locals.user || null,
  };
};
