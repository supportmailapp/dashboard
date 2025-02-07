<script lang="ts">
  import { gg } from "$lib/stores/guild.svelte";
  import { numberToHex } from "$lib/utils/formatting";

  $effect(() => {
    console.log("guild", $state.snapshot(gg.guild));
    console.log("channels", $state.snapshot(gg.channels));
    console.log("roles", $state.snapshot(gg.roles));
  });
</script>

{#if gg.guild}
  <h1>{gg.guild.name}</h1>

  <div class="dy-divider my-2"></div>

  <h2>Channels</h2>

  {#if gg.channels}
    <ol class="list-decimal">
      {#each gg.channels as channel}
        <li class="list-inside">
          <span>{channel.name} ({channel.id})</span>
          <span>Type: {channel.type}</span>
          <span>Parent: {channel.parentId || ""}</span>
        </li>
      {/each}
    </ol>
  {/if}

  <div class="dy-divider my-2"></div>

  <h2>Roles</h2>

  {#if gg.roles}
    <ol class="list-decimal">
      {#each gg.roles as role}
        <li class="list-inside">
          <span>{role.name} ({role.id})</span>
        </li>
      {/each}
    </ol>
  {/if}
{:else}
  <h1>Loading...</h1>
{/if}
