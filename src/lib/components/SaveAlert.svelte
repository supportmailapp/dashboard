<script lang="ts">
  import { beforeNavigate } from "$app/navigation";
  import { resetConfig, saving, unsavedChanges } from "$lib/stores/config.svelte";
  import { scale, slide } from "svelte/transition";

  beforeNavigate(async (nav) => {
    if (unsavedChanges) {
      if (nav.to?.url.origin === location.origin) {
        const confirm = window.confirm("You have unsaved changes. Are you sure you want to leave this page?");
        if (!confirm) {
          nav.cancel();
          unsavedChanges.set(false);
          return;
        }
      }
    }
  });
</script>

<div class="save-alert-container" transition:scale={{ duration: 150 }}>
  <savealert
    role="alert"
    class="dy-alert dy-alert-warning dy-alert-soft sm:dy-alert-horizontal dy-alert-vertical {saving.value
      ? 'pointer-events-none cursor-default'
      : ''}"
    transition:slide={{ duration: 150, axis: "y" }}
  >
    <span class="text-base font-semibold md:text-lg">You have unsaved changes!</span>
    <div class="ml-auto flex w-full justify-end gap-x-3 md:w-fit">
      <button
        type="reset"
        class="dy-btn-accent h-8 w-30"
        disabled={saving.value || $resetConfig}
        onclickcapture={() => resetConfig.set(true)}
      >
        Discard
      </button>
      <button
        class="dy-btn-success h-8 w-30"
        onclick={() => {
          saving.value = true;
          saving.progress = 0;
          const interval = setInterval(() => {
            if (saving.progress! >= 100) {
              clearInterval(interval);
              saving.value = false;
              saving.progress = 0;
            } else {
              saving.progress! += 10;
            }
          }, 1000);
        }}
        disabled={saving.value}
      >
        {#if saving.value}
          <div class="relative w-full">
            <progress class="dy-progress dy-progress-success w-full" value={saving.progress} max="100"></progress>
          </div>
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
