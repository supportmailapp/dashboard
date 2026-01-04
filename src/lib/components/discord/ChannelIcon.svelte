<script lang="ts">
  import Hash from "@lucide/svelte/icons/hash";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import Logs from "@lucide/svelte/icons/logs";
  import { ChannelType, type GuildChannelType } from "discord-api-types/v10";
  import DiscordForumIcon from "$lib/assets/DiscordForumIcon.svelte";
  import type { ClassValue } from "svelte/elements";
  import DCThreadIcon from "$lib/assets/DCThreadIcon.svelte";

  let { type: cType, class: className }: { type?: GuildChannelType; class?: ClassValue } = $props();
</script>

{#if cType === ChannelType.GuildCategory}
  <Logs class={className} />
{:else if cType === ChannelType.GuildStageVoice || cType === ChannelType.GuildVoice}
  <Volume2 class={className} />
{:else if cType === ChannelType.GuildForum}
  <DiscordForumIcon class={className} />
{:else if cType === ChannelType.PublicThread || cType === ChannelType.PrivateThread}
  <DCThreadIcon class={className} />
{:else}
  <Hash class={className} />
{/if}