import { env } from "$env/dynamic/private";

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

  /**
   * Filters the mutual guilds between the user and the client.
   *
   * @param userGuilds - An array of guild IDs that the user is a member of.
   * @returns A promise that resolves to an array of mutual guild IDs or null if an error occurs.
   */
  public async filterMutualGuilds(userGuilds: string[]): Promise<string[]> {
    try {
      const res = await fetch(env.clientAPIOrigin + "/guilds/filter", {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ guilds: userGuilds }),
      });

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
