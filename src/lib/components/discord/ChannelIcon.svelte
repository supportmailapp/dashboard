<script lang="ts">
  import Hash from "@lucide/svelte/icons/hash";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import Logs from "@lucide/svelte/icons/logs";
  import { ChannelType } from "discord-api-types/v10";
  import DiscordForumIcon from "$lib/assets/DiscordForumIcon.svelte";
  import Skeleton from "$ui/skeleton/skeleton.svelte";
  import type { ClassValue } from "clsx";
  import { cn } from "$lib/utils";

  let { type: cType, class: className }: { type?: GuildCoreChannelType; class?: ClassValue } = $props();
</script>

{#if cType === undefined}
  <Skeleton class={cn(className)} />
{:else if cType === ChannelType.GuildCategory}
  <Logs class={cn(className)} />
{:else if cType === ChannelType.GuildStageVoice || cType === ChannelType.GuildVoice}
  <Volume2 class={cn(className)} />
{:else if cType === ChannelType.GuildForum}
  <DiscordForumIcon class={cn(className)} />
{:else}
  <Hash class={cn(className)} />
{/if}
