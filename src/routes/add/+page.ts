import { env } from "$env/dynamic/public";
import { urls } from "$lib/constants.js";
import { redirect } from "@sveltejs/kit";

export const load = async function () {
  return redirect(302, urls.botAuth(env.PUBLIC_ClientId));
};
