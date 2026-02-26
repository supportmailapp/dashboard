// Helper functions for session management
import { env } from "$env/dynamic/private";
import { discordUrls } from "$lib/urls";
import { canManageBot } from "$lib/server/permissions";
import jwt from "jsonwebtoken";
import userGuildsCache from "./caches/userGuilds";
import { discord } from "./constants";
import { DBGuild, DBUser } from "./db";
import { UserToken } from "./db/models/src/userTokens";
import { DiscordUserAPI } from "./discord";
import { UserRole } from "$lib/sm-types/src";

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

    const modUser = await DBUser.exists({ id: data.userId, roles: { $in: [UserRole.Moderator] } });
    const isMod = !!modUser;

    // Encrpytion happens automatically in the UserToken model
    const tokenData = await UserToken.findOneAndUpdate(
      { userId: data.userId },
      {
        expiresAt: expiresAt,
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken ?? null,
        clearance: data.userId === env.OWNER_ID ? "admin" : isMod ? "mod" : "user",
      },
      { returnDocument: "after", upsert: true },
    );

    return tokenData._id.toString();
  }

  static async getAndDeleteToken(id: string): Promise<FlatUserToken | null> {
    const token = await UserToken.findOneAndDelete({ userId: id });
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
        client_id: discord.clientId!,
        client_secret: discord.clientSecret!,
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
            console.error("Odd status code from User API when checking guild access", {
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

    // Check if the guild exists in DB and is not marked for deletion
    const guildExists = await DBGuild.exists({
      id: guildId,
      $or: [{ "flags.deleteAfter": { $exists: false } }, { "flags.deleteAfter": null }],
    }).then((res) => !!res);

    if (!guildExists) {
      return 404;
    }

    const dbUser = await DBUser.exists({ id: userId, roles: { $in: [UserRole.Admin] } });
    const isAdmin = !!dbUser;

    // 3. Check for at least manager permissions for that guild
    return isAdmin || canManageBot(targetGuild.permissions) ? 200 : 403;
  } catch (error) {
    console.error("Error checking user guild access:", error);
    return 500;
  }
}
