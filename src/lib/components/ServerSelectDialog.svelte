<script lang="ts">
  import { page } from "$app/state";
  import { guilds } from "$lib/stores/guilds.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { scale, slide } from "svelte/transition";

  let innerWidth = $state(800);
</script>

<svelte:window bind:innerWidth />

<dialog id="server-select" class="dy-modal dy-modal-bottom md:dy-modal-middle overflow-hidden">
  <div class="dy-modal-box bg-base-200 max-h-screen md:max-h-fit" transition:scale={{ duration: 200 }}>
    <div class="mb-3 flex flex-row overflow-hidden">
      <h3 class="dy-modal-title font-semibold select-none">Select a Server</h3>
      <form method="dialog" class="ml-auto">
        <button
          class="dy-btn dy-btn-circle dy-btn-sm flex-row"
          aria-label="Close"
          onclick={() => (document.getElementById("server-select") as HTMLDialogElement).close()}
        >
          <img src="/icons/x.svg" alt="Close" class="size-6" />
        </button>
      </form>
    </div>

    <div class="max-h-full overflow-y-auto md:max-h-full">
      <ul class="dy-dropdown-content dy-menu bg-base-300 rounded-box dy z-1 w-full gap-y-1 p-2 shadow-sm">
        {#each guilds.value as guild}
          <li>
            {#if page.url.pathname.startsWith("/g/" + guild.id)}
              <!-- svelte-ignore a11y_missing_attribute -->
              <a class="bg-base-content/10 cursor-default">
                <div class="dy-avatar">
                  <div class="dy-mask dy-mask-squircle size-8">
                    <img src={cdnUrls.guildIcon(guild.id, guild.icon, "512")} alt="Guild Icon" />
                  </div>
                </div>
                <span class="truncate">{guild.name}</span>
              </a>
            {:else}
              <a href="{!guild.isConfigured ? '/add' : '/g'}/{guild.id}" target="_self">
                <div class="dy-avatar">
                  <div class="dy-mask dy-mask-squircle size-8">
                    <img src={cdnUrls.guildIcon(guild.id, guild.icon, "512")} alt="Guild Icon" />
                  </div>
                </div>
                <span class="truncate">{guild.name}</span>
              </a>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  </div>
</dialog>
