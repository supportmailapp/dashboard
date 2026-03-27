import { page } from "$app/state";
import { APIRoutes } from "$lib/urls.svelte";
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
    const res = await apiClient.get<BotGuild[]>(APIRoutes.userGuilds(true));

    if (res.ok) {
      console.log("guildsJson", res.data);
      // Separate configured and unconfigured guilds
      const configuredGuilds = res.data.filter((g) => g.isConfigured);
      const unconfiguredGuilds = res.data.filter((g) => !g.isConfigured);
      // Sort each group by number of features
      configuredGuilds.sort((a, b) => b.features.length - a.features.length);
      unconfiguredGuilds.sort((a, b) => b.features.length - a.features.length);
      // Combine the two groups
      const guilds = [...configuredGuilds, ...unconfiguredGuilds];
      this.guilds = guilds;
      this.loaded = true;
    } else {
      this.loaded = false;
    }
  }

  async loadChannels(force = false) {
    if (!this.currentGuild) {
      console.warn("No current guild set, cannot load channels.");
      return;
    }

    this.channelsLoaded = false;

    const res = await apiClient.get<GuildCoreChannel[]>(APIRoutes.guildChannels(force));

    if (res.ok) {
      this.channels = sortByPositionAndId(res.data);
      this.channelsLoaded = true;
    } else {
      console.error("Failed to load channels for guild:", this.currentGuild.id);
      this.channels = [];
      this.channelsLoaded = false;
    }
  }

  async loadRoles(force = false) {
    if (!this.currentGuild) {
      console.warn("No current guild set, cannot load roles.");
      return;
    }
    this.rolesLoaded = false;

    const res = await apiClient.get<APIRole[]>(APIRoutes.guildRoles(force));

    if (res.ok) {
      sortByPositionAndId(res.data).forEach((r) => this.roles.set(r.id, r));
      this.rolesLoaded = true;
    } else {
      console.error("Failed to load roles for guild:", this.currentGuild.id);
      this.roles.clear();
    }
  }

  async fetchChannelById(id: string, retry = true) {
    if (!this.currentGuild) {
      console.warn("No current guild set, cannot fetch channel.");
      return;
    }
    // check caches first
    if (this.customChannels.has(id)) {
      return this.customChannels.get(id)!;
    } else if (this.channels.some((c) => c.id === id)) {
      return this.channels.find((c) => c.id === id)!;
    }

    // fetch from API
    const channelRes = await apiClient.get<APIGuildChannel>(APIRoutes.guildChannel(id), {
      retry: retry ? undefined : 0,
    });
    if (channelRes.ok) {
      this.customChannels.set(id, channelRes.data);
    }
    return this.customChannels.get(id);
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
