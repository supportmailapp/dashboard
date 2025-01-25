import { env } from "$env/dynamic/private";

class ClientAPIImitator {
  private readonly privateToken = env.clientAPIToken;

  // Mutual Guilds with luke
  private readonly relevantGuilds: string[] = [
    "1008818461553725572",
    "1064594649668395128",
    "461533332979843083",
    "269903523381116931",
    "1114825999155200101",
    "123123123",
  ];

  constructor() {}

  public async filterMutualGuilds(userGuilds: string[]): string[] {
    const filtered = userGuilds.filter((gid) => this.relevantGuilds.includes(gid));
    return filtered;
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
  public async filterMutualGuilds(userGuilds: string[], userId: string): Promise<string[]> {
    try {
      const res = await clientAPIImitate.filterMutualGuilds(userGuilds);

      if (!res.ok) {
        throw { message: "Failed to fetch mutual guilds", payload: { userGuilds } };
      }

      return (await res.json()) as string[];
    } catch (err) {
      console.error(err);
      return [];
    }
  }
}

export { ClientAPI };

const clientAPI = new ClientAPI(env.clientAPIToken);

export default clientAPI;
