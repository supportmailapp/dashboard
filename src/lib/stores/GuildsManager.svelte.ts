import { page } from "$app/state";
import { APIRoutes } from "$lib/urls";
import apiClient from "$lib/utils/apiClient";
import { sortByPositionAndId } from "$lib/utils/formatting.js";
import type { APIRole } from "discord-api-types/v10";
import { createContext } from "svelte";
import { SvelteMap } from "svelte/reactivity";

export class GuildsManager {
  public guildId = $derived<string | undefined>(page.params.guildid);
  /**
   * The filtered guilds that where the user has at least managar permissions.
   */
  guilds = $state<BotGuild[]>([]);
  /**
   * The channels of the current guild.
   */
  channels = $state<GuildCoreChannel[]>([]);
  /**
   * Fetched Custom Channels for the current guild.
   */
  readonly customChannels = new SvelteMap<string, APIGuildChannel>();
  /**
   * The roles of the current guild.
   */
  readonly roles = new SvelteMap<string, APIRole>();
  currentGuild = $derived(this.guildId ? this.guilds.find((g) => g.id === this.guildId) : null);
  loaded = $state(false);

  /**
   * Whether the channels for the current guild have been loaded and are available.
   */
  channelsLoaded: boolean = $state(false);
  /**
   * Whether the roles for the current guild have been loaded and are available.
   */
  rolesLoaded: boolean = $state(false);

  async loadGuilds() {
    this.loaded = false;
    const guildsRes = await apiClient.get(APIRoutes.userGuilds(true));

    if (guildsRes.ok) {
      let guildsJson: BotGuild[] = await guildsRes.json();
      console.log("guildsJson", guildsJson);
      // Separate configured and unconfigured guilds
      const configuredGuilds = guildsJson.filter((g) => g.isConfigured);
      const unconfiguredGuilds = guildsJson.filter((g) => !g.isConfigured);
      // Sort each group by number of features
      configuredGuilds.sort((a, b) => b.features.length - a.features.length);
      unconfiguredGuilds.sort((a, b) => b.features.length - a.features.length);
      // Combine the two groups
      guildsJson = [...configuredGuilds, ...unconfiguredGuilds];
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

    const channelsRes = await apiClient.get(APIRoutes.guildChannels(this.currentGuild.id));

    if (channelsRes.ok) {
      let channelsJson: GuildCoreChannel[] = await channelsRes.json();
      this.channels = sortByPositionAndId(channelsJson);
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

    const rolesRes = await apiClient.get(APIRoutes.guildRoles(this.currentGuild.id));

    if (rolesRes.ok) {
      let rolesJson: APIRole[] = await rolesRes.json();
      sortByPositionAndId(rolesJson).forEach((r) => this.roles.set(r.id, r));
      this.rolesLoaded = true;
    } else {
      console.error("Failed to load roles for guild:", this.currentGuild.id);
      this.roles.clear();
    }
  }

  clearCurrentGuild() {
    // Since currentGuild is derived from guilds, we can't reset it directly.
    this.channels = [];
    this.roles.clear();
    this.customChannels.clear();
    this.channelsLoaded = false;
    this.rolesLoaded = false;
  }
}

const [get, set] = createContext<GuildsManager>();

export const getManager = get;

export function setManager() {
  return set(new GuildsManager());
}
