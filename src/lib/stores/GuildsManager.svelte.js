import { BasicFetchInit } from "$lib/constants";
import { APIRoutes } from "$lib/urls";

export class GuildsManager {
  /**
   * The filtered guilds that where the user has at least managar permissions.
   *
   * @type {BotGuild[]}
   */
  guilds = $state([]);

  constructor() {}

  async loadGuilds() {
    const guildsRes = await fetch(APIRoutes.userGuilds(true), BasicFetchInit("GET"));

    if (guildsRes.ok) {
      /** @type {BotGuild[]} */
      let guildsJson = await guildsRes.json();
      // Sort guilds by configured or not
      guildsJson.sort((a, b) => {
        if (a.isConfigured && !b.isConfigured) return -1;
        if (!a.isConfigured && b.isConfigured) return 1;
        return 0;
      });
      this.guilds = guildsJson;
    }
  }
}
