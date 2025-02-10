<script lang="ts">
  import { mediaQuery } from "$lib/constants";
  import { guilds } from "$lib/stores/guilds.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { slide } from "svelte/transition";

  let innerWidth = $state(800);
</script>

<svelte:window bind:innerWidth />

<dialog id="server-select" class="dy-modal dy-modal-bottom md:dy-modal-middle">
  <div class="dy-modal-box h-screen max-h-screen md:h-fit" transition:slide={{ duration: 200, axis: "y" }}>
    <div class="mb-3 flex flex-row">
      <h3 class="dy-modal-title font-semibold select-none">Select a Server</h3>
      <form method="dialog" class="ml-auto">
        <button
          class="dy-btn dy-btn-circle dy-btn-lg flex-row"
          aria-label="Close"
          onclick={() => (document.getElementById("server-select") as HTMLDialogElement).close()}
        >
          <img src="/x.svg" alt="Close" class="size-6" />
        </button>
      </form>
    </div>
    <div class="max-h-full overflow-y-auto md:max-h-full">
      <ul class="dy-dropdown-content dy-menu bg-base-200 rounded-box dy z-1 w-full overflow-y-auto p-2 shadow-sm">
        {#each guilds.value as guild}
          <li>
            <a href="/{guild.id}" target="_self">
              <div class="dy-avatar">
                <div class="w-8 rounded-xl">
                  <img src={cdnUrls.guildIcon(guild.id, guild.iconHash, "512")} alt="Guild Icon" />
                </div>
              </div>
              <span>{guild.name}</span>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</dialog>
