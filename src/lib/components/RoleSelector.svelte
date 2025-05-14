<script lang="ts">
  import { gg } from "$lib/stores/guild.svelte";
  import { numberToHex } from "$lib/utils/formatting";
  import { Circle } from "@lucide/svelte";
  import { blur, scale } from "svelte/transition";
  import { onDestroy, onMount, type Snippet } from "svelte";

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
    show: boolean;
    /**
     * The text to display in the dialog. If not provided, no text will be shown.
     */
    text?: string;
    /**
     * Callback function to be called when a role is selected.
     * @param role The selected role.
     */
    onselect?: (role: BasicRole) => void;
  };

  let {
    exclude = [],
    managedRolesBehavior = "no-select",
    excludeAtEveryone = false,
    show = $bindable(false),
    text = undefined,
    onselect = () => {
      console.warn("No handler defined!");
    },
  }: Props = $props();

  // Internal state
  let popupElement = $state<HTMLDialogElement>();

  function roleIsAllowed(role: BasicRole) {
    if (exclude.includes(role.id)) return false;
    if (managedRolesBehavior === "exclude" && role.managed) return false;
    if (excludeAtEveryone && role.id === gg.guild?.id) return false;
    return true;
  }

  $effect(() => {
    if (show) popupElement?.showModal();
    else popupElement?.close();
  });

  let selected = $state<BasicRole | undefined>(undefined);
  let search = $state("");
  let filteredRoles = $derived<BasicRole[]>(gg.roles?.filter((r) => roleIsAllowed(r)) || []);
</script>

<dialog bind:this={popupElement} class="dy-modal dy-modal-bottom md:dy-modal-middle">
  <div
    class="dy-modal-box flex h-full flex-col gap-1 overflow-hidden p-3 md:max-h-[600px] md:max-w-[350px]"
    transition:scale={{ duration: 150 }}
  >
    {#if text}
      <h1 class="text-lg font-semibold">{text}</h1>
    {/if}
    <label class="dy-input h-8 w-full">
      <input type="search" bind:value={search} placeholder="Role..." class="h-8" />
    </label>
    {#if filteredRoles.length}
      <div
        class="bg-base-200 flex h-full w-full flex-col items-start gap-1 overflow-x-hidden overflow-y-auto rounded border border-slate-500 p-2"
      >
        {#if search !== "" && filteredRoles.filter((role) => role.name
              .toLowerCase()
              .includes(search.toLowerCase())).length === 0}
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
                if (managedRolesBehavior === "no-select" && role.managed) {
                  alert("This role is managed by a Discord App and cannot be selected.");
                  return;
                }
                selected = role;
                search = "";
                onselect(role);
                show = false;
              }}
              transition:blur={{ duration: 100 }}
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
    <div class="dy-modal-action" style="width: 100%" onsubmit={() => (show = false)}>
      <form method="dialog" style="width: 100%">
        <button class="dy-btn dy-btn-error dy-btn-sm bg-error/80 hover:bg-error" style="width: 100%"
          >I changed my mind</button
        >
      </form>
    </div>
  </div>
  <form method="dialog" class="dy-modal-backdrop" onsubmit={() => (show = false)}>
    <button>close</button>
  </form>
</dialog>
