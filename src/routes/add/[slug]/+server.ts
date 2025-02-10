import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { urls } from "$lib/constants";
import { env } from "$env/dynamic/private";

export const GET: RequestHandler = async ({ params }) => {
  return redirect(302, urls.botAuth(env.clientId, params.slug));
};
