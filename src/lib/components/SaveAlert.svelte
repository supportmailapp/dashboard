<script lang="ts">
  import { slide } from "svelte/transition";
  import { gg } from "$lib/stores/guild.svelte";
  import { beforeNavigate } from "$app/navigation";
  import { site } from "$lib/stores/site.svelte";

  type SaveModalProps = {
    /**
     * The payload to send to the destination
     */
    payload: any;
    /**
     * The method to use for the request.
     */
    method: "POST" | "PATCH" | "PUT" | "DELETE";
    /**
     * The destination to send the request to.
     *
     * Can be a string or a URL object.
     */
    destination: `/${string}` | URL;
  };

  let { payload, method, destination }: SaveModalProps = $props();

  let saving = $state<number>(100);

  async function saveFunction(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Saving...";
    saving = 0;

    if (destination.toString().startsWith("/")) {
      destination = new URL(destination, window.location.origin);
    }

    const response = await fetch(destination.toString(), {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
      cache: "no-cache",
    }).catch((error) => {
      console.error("Failed to save:", error);
      saving = 100;
      button.disabled = false;
      button.textContent = "Save";
      return null;
    });

    if (!response || !response.ok) {
      console.error("Failed to save:", response);
      saving = 100;
      button.disabled = false;
      button.textContent = "Save";
      return;
    }
  }

  beforeNavigate(async (nav) => {
    if (gg.unsavedChanges) {
      if (nav.type == "leave" || nav.type == "popstate" || nav.type == "goto" || nav.type == "link") {
        document.getElementById("save-alert")?.classList.add("dy-alert-error");
        setTimeout(() => {
          document.getElementById("save-alert")?.classList.remove("dy-alert-error");
        }, 1100);
        nav.cancel();
        return;
      }
    }
    site.loading = true;
    nav.complete.then(() => {
      site.loading = false;
    });
  });

  async function simulateSave() {
    saving = 0;
    while (saving < 100) {
      saving += 10;
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    saving = 100;
  }
</script>

<div class="save-alert-container">
  <div
    role="alert"
    class="dy-alert dy-alert-warning dy-alert-soft sm:dy-alert-horizontal dy-alert-vertical w-full max-w-[800px] overflow-hidden {saving !=
    100
      ? 'pointer-events-none cursor-default'
      : ''}"
    style="user-select: none;"
    transition:slide={{ duration: 150, axis: "y" }}
  >
    <span class="text-base font-semibold md:text-lg">You have unsaved changes!</span>
    <div class="ml-auto flex w-full justify-end gap-x-3 md:w-fit">
      <button type="reset" class="dy-btn-accent h-8 w-30" disabled={saving != 100}>Reset</button>
      <button class="dy-btn-success h-8 w-30" onclick={() => simulateSave()} disabled={saving != 100}>
        {#if saving < 100}
          <progress class="dy-progress dy-progress-success"></progress>
        {:else}
          Save
        {/if}
      </button>
    </div>
  </div>
</div>
