import { env } from "$env/dynamic/private";
import type { IDBGuild } from "supportmail-types";
import { getDocuments } from "./db";

class ClientAPIImitator {
  private readonly privateToken = env.clientAPIToken;

  constructor() {}

  public async filterMutualGuilds(userGuilds: string[]): Promise<string[]> {
    const relevantGuildIds = await getDocuments<IDBGuild>("guilds", {
      id: { $in: userGuilds },
    }).then((guilds) => guilds.map((guild) => guild.id));
    return userGuilds.filter((guild) => relevantGuildIds.includes(guild));
  }

  public async setupTickets(): Promise<any> {
    return;
  }
}

const clientAPIImitate = new ClientAPIImitator();

/**
 * Helper class for the client API. This class is used to provide a set of utility functions to the client API.
 */
class ClientAPI {
  private token: string;

  /**
   * Creates a new instance of the client API helper.
   * @param _token The API token to use for the client API.
   */
  constructor(_token: string) {
    this.token = _token;
  }

  // Build Headers
  private buildHeaders(userId: string, contentType = "application/json"): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      "content-type": contentType,
      "x-user-id": userId,
    };
  }

  /**
   * Filters the mutual guilds between the user and the client.
   *
   * @param userGuilds - An array of guild IDs that the user is a member of.
   * @returns A promise that resolves to an array of mutual guild IDs or null if an error occurs.
   */
  public async filterMutualGuilds(userGuilds: string[]): Promise<string[]> {
    try {
      const res = await clientAPIImitate.filterMutualGuilds(userGuilds);

      return res;
    } catch (err) {
      console.error(err);
      return [];
    }
  }
}

export { ClientAPI };

const clientAPI = new ClientAPI(env.clientAPIToken);

export default clientAPI;
