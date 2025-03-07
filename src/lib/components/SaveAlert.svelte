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

  let saving = $state<null | number>(null);

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
      saving = null;
      button.disabled = false;
      button.textContent = "Save";
      return null;
    });

    if (!response || !response.ok) {
      console.error("Failed to save:", response);
      saving = null;
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
</script>

<div
  id="save-alert"
  role="alert"
  class="dy-alert dy-alert-warning dy-toast dy-toast-center w-full max-w-[800px] transition-colors duration-150 ease-in-out select-none"
  transition:slide={{ duration: 150, axis: "y" }}
>
  <span class="text-xl font-semibold">You have unsaved changes!</span>
  <div class="ml-auto flex justify-end gap-x-3">
    <button type="reset" class="dy-btn dy-btn-accent dy-btn-outline w-30">Reset</button>
    {#if !saving}
      <button class="dy-btn dy-btn-success dy-btn-outline w-30" onclick={saveFunction}>Save</button>
    {:else}
      <progress class="dy-progress dy-progress-success w-56" value={saving} max="100"></progress>
    {/if}
  </div>
</div>
