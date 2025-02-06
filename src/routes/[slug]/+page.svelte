<script lang="ts">
  import { channels, guild, roles } from "$lib/stores/guild.svelte.js";

  $effect(() => {
    console.log("guild", $state.snapshot($guild));
  });
</script>

{#if $guild}
  <h1>{$guild.name}</h1>

  <div class="dy-divider-neutral my-2"></div>

  <h2>Channels</h2>

  {#if $channels}
    {#each $channels as channel}
      <p>{channel.name}</p>
    {/each}
  {/if}

  <div class="dy-divider-neutral my-2"></div>

  <h2>Roles</h2>

  {#if $roles}
    {#each $roles as role}
      <p class="text-[{role.color}]">{role.name} ({role.id})</p>
    {/each}
  {/if}
{:else}
  <div class="dy-loading-spinner w-10"></div>
{/if}
