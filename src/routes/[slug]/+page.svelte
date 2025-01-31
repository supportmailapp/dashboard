<script lang="ts">
  import { onMount } from "svelte";

  let { data } = $props();
  // onMount(() => {
  //   data.guild = fetch(`/api/v1/guilds?guild_id=${data.guildId}`).then((res) => res.json());
  // });
</script>

{#if data.guild}
  {#await data.guild}
    <div class="dy-loading-spinner w-10"></div>
  {:then guild}
    <h1>{guild?.name}</h1>

    <div class="dy-divider-neutral my-2"></div>

    <h2>Channels</h2>

    {#if guild?.channels}
      {#each guild.channels as channel}
        <p>{channel.name}</p>
      {/each}
    {/if}

    <div class="dy-divider-neutral my-2"></div>

    <h2>Roles</h2>

    {#if guild?.roles}
      {#each guild.roles as role}
        <p class="text-[{role.color}]">{role.name} ({role.id})</p>
      {/each}
    {/if}
  {/await}
{/if}
