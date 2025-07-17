import { page } from "$app/state";
import { BasicFetchInit } from "$lib/constants";
import { APIRoutes } from "$lib/urls";

export class GuildsManager {
  /**
   * The filtered guilds that where the user has at least managar permissions.
   *
   * @type {BotGuild[]}
   */
  guilds = $state([]);
  /**
   * The channels of the current guild.
   *
   * @type {GuildCoreChannel[] | null}
   */
  channels = $state([]);
  /**
   * The roles of the current guild.
   *
   * @type {GuildRole[]  | null}
   */
  roles = $state([]);
  currentGuild = $derived(page.params.guildid ? this.guilds.find((g) => g.id === page.params.guildid) : null);
  loaded = $state(false);

  /**
   * Whether the channels for the current guild have been loaded and are available.
   *
   * @type {boolean}
   */
  channelsLoaded = $state(false);
  /**
   * Whether the roles for the current guild have been loaded and are available.
   *
   * @type {boolean}
   */
  rolesLoaded = $state(false);

  constructor() {}

  async loadGuilds() {
    const guildsRes = await fetch(APIRoutes.userGuilds(true), BasicFetchInit("GET"));

    if (guildsRes.ok) {
      /** @type {BotGuild[]} */
      let guildsJson = await guildsRes.json();
      console.log("guildsJson", guildsJson);
      // Sort guilds by configured or not (configured first)
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

  async loadChannels() {
    if (!this.currentGuild) {
      console.warn("No current guild set, cannot load channels.");
      return;
    }

    this.channelsLoaded = false;

    const channelsRes = await fetch(APIRoutes.guildChannels(this.currentGuild.id), BasicFetchInit("GET"));

    if (channelsRes.ok) {
      /** @type {GuildCoreChannel[]} */
      let channelsJson = await channelsRes.json();
      this.channels = channelsJson;
      this.channelsLoaded = true;
    } else {
      console.error("Failed to load channels for guild:", this.currentGuild.id);
      this.channels = [];
      this.channelsLoaded = false;
    }
  }

  async loadRoles() {
    if (!this.currentGuild) {
      console.warn("No current guild set, cannot load roles.");
      return;
    }
    this.rolesLoaded = false;

    const rolesRes = await fetch(APIRoutes.guildRoles(this.currentGuild.id), BasicFetchInit("GET"));

    if (rolesRes.ok) {
      /** @type {GuildRole[]} */
      let rolesJson = await rolesRes.json();
      this.roles = rolesJson;
      this.rolesLoaded = true;
    } else {
      console.error("Failed to load roles for guild:", this.currentGuild.id);
      this.roles = [];
    }
  }

  clearCurrentGuild() {
    // Since currentGuild is derived from guilds, we can't reset it directly.
    this.channels = [];
    this.roles = [];
  }
}
