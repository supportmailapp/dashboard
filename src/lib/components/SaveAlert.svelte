<script lang="ts">
  import { beforeNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import { site } from "$lib/stores/site.svelte";
  import { slide } from "svelte/transition";

  beforeNavigate(async (nav) => {
    if (page.data.dataState.unsaved) {
      // TODO: If user clicks a link and then "cancel" in the confirm alert, the page kind of "reloads" and
      // loads indefinitely. Fix it.
      if (nav.to?.url.origin === location.origin || nav.type === "goto" || nav.type === "leave") {
        const confirm = window.confirm("You have unsaved changes. Are you sure you want to leave this page?");
        if (!confirm) {
          nav.cancel();
          return;
        }
      }
    }
    site.showLoading = true;
    page.data.dataState.revert();
  });
</script>

{#if page.data.dataState.unsaved}
  <div class="save-alert-container" transition:slide={{ duration: 150, axis: "y" }}>
    <savealert
      role="alert"
      class="dy-alert dy-alert-warning dy-alert-soft sm:dy-alert-horizontal dy-alert-vertical {page.data.dataState.saving
        ? 'pointer-events-none cursor-default'
        : ''}"
      transition:slide={{ duration: 150, axis: "y" }}
    >
      <span class="text-base font-semibold">You have unsaved changes!</span>
      <div class="ml-auto flex w-full justify-end gap-x-3 md:w-fit">
        <button
          type="reset"
          class="dy-btn-warning h-8 w-30"
          disabled={page.data.dataState.saving}
          onclick={page.data.dataState.revert}
        >
          Reset
        </button>
        <button class="dy-btn-success h-8 w-30" onclick={page.data.dataState.save} disabled={page.data.dataState.saving}>
          {#if page.data.dataState.saving}
            <div class="relative w-full">
              <progress class="dy-progress dy-progress-success w-full" value={page.data.dataState.saveProgress} max="100">
              </progress>
            </div>
          {:else}
            Save
          {/if}
        </button>
      </div>
    </savealert>
  </div>
{/if}

<style>
  savealert {
    overflow: hidden;
    width: 100%;
    max-width: 800px;
    user-select: none;
    -webkit-user-select: none;
  }
</style>
