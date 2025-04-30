<script lang="ts">
  import { gg } from "$lib/stores/guild.svelte";
  import { Search } from "@lucide/svelte";

  type Props = {
    onselect?: (role: BasicRole) => void;
  };

  let { onselect = () => {} }: Props = $props();

  let selected = $state<BasicRole | undefined>(undefined);
  let search = $state("");
</script>

<!-- TODO: How to anchor this to a parent HTML element? like, centered/left/right - top/bottom -->
<div class="flex flex-col">
  <label class="dy-input">
    <Search class="size-5" />
    <input type="search" bind:value={search} placeholder="Role..." class="grow" />
  </label>
  {#if gg.roles}
    <ul class="dy-menu h-64 w-52">
      {#each gg.roles as role}
        {#if search == "" || role.name.toLowerCase().includes(search.toLowerCase())}
          <li>
            <button
              role="option"
              aria-selected={selected == role}
              onclick={() => {
                selected = role;
                onselect(role);
              }}
            >
              {role.name}
            </button>
          </li>
        {/if}
      {/each}
    </ul>
  {:else}
    <div class="dy-list-item">No roles found</div>
  {/if}
</div>
