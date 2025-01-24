// Public constants

import { env } from "$env/dynamic/public";

export const mediaQuery = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xl2: 1536,
} as const;

interface AuthorizeUrlParams {
  clientId: string;
  scope: string;
  state: string;
  redirectUri: string;
  promt?: string;
}

export const urls = {
  discordBase: env.PUBLIC_DISCORD_BASE_URL,
  authorize: function ({ clientId, scope, state, redirectUri, promt = "none" }: AuthorizeUrlParams): string {
    return (
      "https://discord.com/oauth2/authorize?" +
      new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        prompt: promt,
        scope: scope,
        redirect_uri: redirectUri,
        state: state,
      }).toString()
    );
  },
  token: () => "https://discord.com/api/oauth2/token",
  revocation: () => "https://discord.com/api/oauth2/token/revoke",
} as const;
