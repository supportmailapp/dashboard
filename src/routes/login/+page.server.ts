import { loginHandler } from "$lib/discord/oauth2";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "../$types";

export const load = (async () => {
  return {};
}) satisfies PageServerLoad;

export const actions = {
  login: async ({ url }) => {
    console.log("login url", url);
    try {
      const res = loginHandler(url);
      console.log("res", res);
      return redirect(303, res.url);
    } catch (err: any) {
      return error(err);
    }
  },
} satisfies Actions;
