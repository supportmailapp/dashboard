import { BasicFetchInit } from "$lib/constants";
import { APIRoutes } from "$lib/urls";

export class GuildsManager {
  /**
   * The filtered guilds that where the user has at least managar permissions.
   *
   * @type {BotGuild[]}
   */
  guilds = $state([]);
  loaded = $state(false);

  constructor() {}

  async loadGuilds() {
    const guildsRes = await fetch(APIRoutes.userGuilds(true), BasicFetchInit("GET"));

    if (guildsRes.ok) {
      /** @type {BotGuild[]} */
      let guildsJson = await guildsRes.json();
      console.log("guildsJson", guildsJson);
      // Sort guilds by configured or not
      guildsJson?.sort((a, b) => {
        if (a.isConfigured && !b.isConfigured) return -1;
        if (!a.isConfigured && b.isConfigured) return 1;
        return 0;
      });
      this.guilds = guildsJson;
      this.loaded = true;
    } else {
      this.loaded = false;
    }
  }
}
