<script lang="ts">
  import { beforeNavigate } from "$app/navigation";
  import { saving, unsavedChanges } from "$lib/stores/config.svelte";
  import { slide } from "svelte/transition";

  beforeNavigate(async (nav) => {
    if (unsavedChanges) {
      if (nav.type == "leave" || nav.type == "popstate" || nav.type == "goto" || nav.type == "link") {
        if (confirm("You have unsaved changes! Are you sure you want to leave?")) {
          unsavedChanges.set(false);
        } else {
          nav.cancel();
          return;
        }
      } else {
        unsavedChanges.set(false);
      }
    }
  });
</script>

<div class="save-alert-container">
  <savealert
    role="alert"
    class="dy-alert dy-alert-warning dy-alert-soft sm:dy-alert-horizontal dy-alert-vertical {$saving
      ? 'pointer-events-none cursor-default'
      : ''}"
    transition:slide={{ duration: 150, axis: "y" }}
  >
    <span class="text-base font-semibold md:text-lg">You have unsaved changes!</span>
    <div class="ml-auto flex w-full justify-end gap-x-3 md:w-fit">
      <button type="reset" class="dy-btn-accent h-8 w-30" disabled={$saving}>Reset</button>
      <button class="dy-btn-success h-8 w-30" onclick={() => saving.set(true)} disabled={$saving}>
        {#if $saving}
          <div class="loader-spinning loader-spinning-green"></div>
        {:else}
          Save
        {/if}
      </button>
    </div>
  </savealert>
</div>

<style>
  savealert {
    overflow: hidden;
    width: 100%;
    max-width: 800px;
    user-select: none;
    -webkit-user-select: none;
  }
</style>
