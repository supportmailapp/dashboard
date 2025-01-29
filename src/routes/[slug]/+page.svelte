<script lang="ts">

  let { data } = $props();

  // This can still be null!
  if (!data.guild) {
    console.error("No guild data found!");
  }
</script>

<h1>{data.guild?.name}</h1>

<div class="dy-divider-neutral my-2"></div>

<h2>Channels</h2>

{#each data.guild.channels as channel}
  <p>{channel.name}</p>
{/each}

<div class="dy-divider-neutral my-2"></div>

<h2>Roles</h2>

{#if data.guild.roles}
  {#each data.guild.roles as role}
    <p class="text-[{role.color}]">{role.name} ({role.id})</p>
  {/each}
{/if}
