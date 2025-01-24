// Private constants

import { env } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";

export const mediaQuery = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xl2: 1536,
} as const;

export const authData = {
  algorithm: "HS256",
  expiresIn: "7d",
} as const;

export const discord = {
  clientId: env.clientId,
  clientSecret: env.clientSecret,
  redirectUri: publicEnv.PUBLIC_discordRedirectUri,
  scopes: ["identify", "guilds", "guilds.members.read"],
} as const;
