<script lang="ts">
  import { gg } from "$lib/stores/guild.svelte";
  import { numberToHex } from "$lib/utils/formatting";
  import { Circle } from "@lucide/svelte";
  import { blur, scale } from "svelte/transition";

  type Props = {
    /**
     * An array of role IDs to exclude from the selection.
     */
    exclude?: string[];
    /**
     * Whether to exclude managed roles from the list.
     */
    managedRolesBehavior?: "exclude" | "include" | "no-select";
    /**
     * Whether to exclude the `@everyone` role from the list.
     */
    excludeAtEveryone?: boolean;
    /**
     * The HTML element to anchor the role selector to.
     */
    anchor?: HTMLElement;
    onselect?: (role: BasicRole) => void;
  };

  let {
    exclude = [],
    managedRolesBehavior = "no-select",
    excludeAtEveryone = false,
    onselect = () => {
      console.warn("No handler defined!");
    },
  }: Props = $props();

  function roleIsAllowed(role: BasicRole) {
    if (exclude.includes(role.id)) return false;
    if (managedRolesBehavior === "exclude" && role.managed) return false;
    if (excludeAtEveryone && role.id === gg.guild?.id) return false;
    return true;
  }

  let selected = $state<BasicRole | undefined>(undefined);
  let search = $state("");
  let filteredRoles = $derived<BasicRole[]>(gg.roles?.filter((r) => roleIsAllowed(r)) || []);
</script>

<div class="flex h-64 w-52 flex-col gap-1 p-2" transition:scale={{ duration: 150 }}>
  <label class="dy-input h-8">
    <input type="search" bind:value={search} placeholder="Role..." class="h-8" />
  </label>
  {#if filteredRoles.length}
    <div
      class="bg-base-200 grid grid-cols-1 place-items-start gap-1 overflow-x-hidden overflow-y-auto rounded border border-slate-500 p-2"
    >
      {#if search !== "" && filteredRoles.filter((role) => role.name.toLowerCase().includes(search.toLowerCase())).length === 0}
        <div class="dy-list-item">No roles found</div>
      {/if}
      {#each filteredRoles as role}
        {#if search === "" || role.name.toLowerCase().includes(search.toLowerCase())}
          <button
            role="gridcell"
            class="flex w-full items-center gap-2 rounded p-2 transition-all duration-100 hover:bg-slate-500/70 {managedRolesBehavior ===
              'no-select' && role.managed
              ? 'cursor-not-allowed opacity-40'
              : ''}"
            aria-selected={selected == role}
            onclick={() => {
              selected = role;
              onselect(role);
            }}
            transition:blur={{ duration: 100 }}
            disabled={managedRolesBehavior === "no-select" && role.managed}
          >
            <Circle class="size-3" fill={"#" + numberToHex(role.color)} color="none" />
            <span class="truncate">{role.name}</span>
          </button>
        {/if}
      {/each}
    </div>
  {:else}
    <div class="dy-list-item">No roles found</div>
  {/if}
</div>
