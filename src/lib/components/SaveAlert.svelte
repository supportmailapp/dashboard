<script lang="ts">
  import { beforeNavigate } from "$app/navigation";
  import { cn } from "$lib/utils";
  import Button from "$ui/button/button.svelte";
  import { Portal } from "bits-ui";
  import { Spring } from "svelte/motion";
  import { fly } from "svelte/transition";

  interface SaveAlertProps {
    saving: boolean;
    unsavedChanges: boolean;
    saveData?: () => Promise<void>;
    discardChanges?: () => void;
  }

  let { saving = $bindable(false), unsavedChanges, saveData, discardChanges }: SaveAlertProps = $props();

  const jiggleSpring = new Spring(0, { stiffness: 0.6, damping: 0.5, precision: 0.1 });
  let jiggling = $state(false);

  async function shakeAlert() {
    if (jiggling) return;
    jiggling = true;
    for (let i = 0; i < 6; i++) {
      jiggleSpring.target = i % 2 === 0 ? 15 : -15;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    jiggleSpring.target = 0;
    jiggling = false;
  }

  beforeNavigate((nav) => {
    if ((nav.type === "goto" || nav.type === "link") && unsavedChanges) {
      shakeAlert();
      nav.cancel();
      return;
    }

    if (unsavedChanges) {
      const confirmation = confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmation) {
        nav.cancel();
      }
    }
  });
</script>

<Portal>
  {#if unsavedChanges}
    <div
      data-type="savealert"
      data-state={unsavedChanges ? "open" : "closed"}
      style="transform: translate(calc(-50% + {jiggleSpring.current}px), 0);"
      class={cn(
        "fixed bottom-4 left-[50%] z-50 flex w-full max-w-[calc(100%-2rem)] flex-col items-center gap-4 rounded-lg border p-6 shadow-lg ring-0 outline-0 transition-all duration-200 sm:max-w-2xl sm:flex-row",
        jiggling ? "bg-destructive" : "bg-background",
      )}
      transition:fly={{ y: 50, duration: 200, opacity: 0.5 }}
    >
      <!-- TODO: Center that shit properly on mobile -->
      <p>You got unsaved changes mate.</p>
      <div class="flex w-full flex-1 flex-row gap-2 sm:w-auto sm:justify-end">
        <Button variant="outline" class="w-auto flex-1 sm:w-33 sm:flex-none" onclick={discardChanges}
          >Discard</Button
        >
        <Button variant="success" class="w-auto flex-1 sm:w-33 sm:flex-none" onclick={saveData}>Save</Button>
      </div>
    </div>
  {/if}
</Portal>

<style>
  [data-type="savealert"] {
    transition-property: background-color;
    transition-duration: 100ms;
  }
</style>
