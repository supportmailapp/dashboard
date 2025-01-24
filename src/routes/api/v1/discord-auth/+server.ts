import { callbackHandler } from "$lib/discord/oauth2";
import type { RequestHandler } from "@sveltejs/kit";

export const POST = callbackHandler satisfies RequestHandler;
