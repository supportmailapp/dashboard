// Helper functions for session management
import { env } from "$env/dynamic/private";
import { canManageBot } from "$lib/utils/permissions";
import * as Sentry from "@sentry/node";
import jwt from "jsonwebtoken";
import userGuildsCache from "./caches/userGuilds";
import { discord } from "./constants";
import { UserToken } from "./db/models/src/userTokens";
import { DiscordUserAPI } from "./discord";
import { discordUrls } from "$lib/urls";
import type { RESTPostOAuth2AccessTokenResult } from "discord-api-types/v10";

type CreateSessionOps = {
  userId: string;
  tokens: {
    accessToken: string;
    refreshToken?: string;
    /**
     * The number of seconds until the access token expires.
     */
    expiresIn: number;
  };
};

class GetTokensResult {
  public readonly token: FlatUserToken | null;
  public readonly expired: boolean;

  constructor(token: FlatUserToken | null, expired: boolean) {
    this.token = token;
    this.expired = expired;
  }

  isFound(): this is Omit<GetTokensResult, "token"> & { token: FlatUserToken } {
    return this.token !== null && typeof this.token === "object" && "accessToken" in this.token;
  }

  isExpired(): this is Omit<GetTokensResult, "token" | "expired"> & { token: FlatUserToken; expired: true } {
    return this.isFound() && this.expired;
  }
}

class SessionManager {
  static async createSession(data: CreateSessionOps): Promise<string> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Encrpytion happens automatically in the UserToken model
    const exists = await UserToken.exists({ userId: data.userId });
    let uTokenId: string;
    if (exists) {
      const uTokenRes = await UserToken.findOneAndUpdate(
        { userId: data.userId },
        {
          expiresAt: expiresAt,
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken ?? null,
        },
        { new: true },
      );
      uTokenId = uTokenRes!._id.toHexString();
    } else {
      const uTokenRes = await UserToken.create({
        userId: data.userId,
        expiresAt: expiresAt,
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken ?? null,
      });
      uTokenId = uTokenRes._id.toHexString();
    }

    const sessionToken = jwt.sign({ id: uTokenId }, env.JWT_SECRET, {
      algorithm: "HS256",
      issuer: "supportmail",
      expiresIn: "7d",
      encoding: "utf-8",
    });

    return sessionToken;
  }

  static decodeToken(_token: string): {
    valid: boolean;
    id: string | null;
    error: "expired" | "other" | null;
  } {
    try {
      const decoded = jwt.verify(_token, env.JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: "supportmail",
      });
      return {
        valid: true,
        id: (decoded as jwt.JwtPayload).id || null,
        error: null,
      };
    } catch (error: any) {
      if (error instanceof jwt.TokenExpiredError) {
        const decoded = jwt.decode(_token);
        if (decoded) {
          return {
            valid: false,
            id: (decoded as jwt.JwtPayload).id,
            error: "expired",
          };
        }
      }

      return {
        valid: false,
        id: null,
        error: "other",
      };
    }
  }

  static async getUserTokenBySession(jwtToken: string): Promise<GetTokensResult> {
    const tokenRes = SessionManager.decodeToken(jwtToken);
    console.debug("Decoded JWT token:", tokenRes);
    if (!tokenRes.valid || tokenRes.error === "other") {
      return new GetTokensResult(null, false);
    }

    const uToken = await UserToken.findById(tokenRes.id!);

    return new GetTokensResult(uToken?.toJSON() || null, tokenRes.error === "expired");
  }

  static async getAndDeleteToken(id: string): Promise<FlatUserToken | null> {
    const token = await UserToken.findByIdAndDelete(id);
    if (!token) return null;
    return token.toObject({ flattenMaps: true, flattenObjectIds: true });
  }

  static async cleanupExpiredTokens(): Promise<void> {
    await UserToken.deleteMany({ expiresAt: { $lt: new Date() } });
  }

  static async revokeToken(token: string, type: "access" | "refresh") {
    await fetch(discordUrls.tokenRevocation(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: discord.clientId,
        client_secret: discord.clientSecret,
        token: token,
        token_type_hint: type + "_token",
      }).toString(),
    }).catch(() => {});
  }
}

export { SessionManager, type CreateSessionOps };

/**
 * Checks if a user has access to manage a bot in a specific Discord guild.
 *
 * This function verifies that the user is a member of the specified guild and has
 * sufficient permissions (manager level) to manage the bot within that guild.
 *
 * @param userId - The Discord user ID to check access for
 * @param guildId - The Discord guild ID to verify access to
 * @param discordUserApi - API instance for fetching Discord user data
 *
 * @returns A Promise that resolves to an HTTP status code:
 *   - `200` - User has valid access and manager permissions
 *   - `403` - User is in the guild but lacks manager permissions
 *   - `404` - User is not a member of the specified guild
 *   - `500` - Internal error occurred during the check
 *
 * @remarks
 * The function first attempts to retrieve user guilds from cache, falling back
 * to fetching from the Discord API if not cached. It then validates guild
 * membership and checks for manager-level permissions using the `canManageBot` function.
 */
export async function checkUserGuildAccess(
  userId: string,
  guildId: string,
  discordUserApi: DiscordUserAPI,
): Promise<200 | 404 | 403 | 500> {
  try {
    // 1. Find user guilds (cache or fetch from Discord)
    let userGuilds = userGuildsCache.getUserGuilds(userId);

    if (!userGuilds) {
      const userGuildsRes = await discordUserApi.getCurrentUserGuilds(userId);
      if (userGuildsRes.isSuccess()) {
        userGuilds = userGuildsRes.data;
      } else if (userGuildsRes.hasDiscordAPIError()) {
        switch (userGuildsRes.error.status) {
          case 403:
            return 403;
          case 404:
            return 404;
          default: {
            Sentry.captureMessage("Odd status code from User API when checking guild access", {
              extra: {
                guildId,
                userId,
                error: userGuildsRes.error,
              },
            });
            break;
          }
        }
      }

      return 500;
    }

    const targetGuild = userGuilds.find((guild) => guild.id === guildId);

    if (!targetGuild) {
      return 404;
    }

    // 3. Check for at least manager permissions for that guild
    return canManageBot(BigInt(targetGuild.permissions)) ? 200 : 403;
  } catch (error) {
    console.error("Error checking user guild access:", error);
    return 500;
  }
}
