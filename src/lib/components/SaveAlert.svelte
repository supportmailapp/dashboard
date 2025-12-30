<script lang="ts">
  import { beforeNavigate } from "$app/navigation";
  import { cn } from "$lib/utils";
  import Button from "$ui/button/button.svelte";
  import { Portal } from "bits-ui";

  interface SaveAlertProps {
    oldCfg: any;
    currentCfg: any;
    saving: boolean;
    unsavedChanges: boolean;
    saveData: () => Promise<void>;
    discardChanges: () => void;
  }

  let {
    oldCfg,
    currentCfg,
    saving = $bindable(false),
    unsavedChanges,
    saveData,
    discardChanges,
  }: SaveAlertProps = $props();
  let jiggling = $state(false);

  function shakeAlert() {
    jiggling = true;
    setTimeout(() => {
      jiggling = false;
    }, 300);
  }

  beforeNavigate((nav) => {
    if (nav.type === "goto" || nav.type === "link") {
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
  <div
    data-type="savealert"
    data-state={unsavedChanges ? "open" : "closed"}
    class={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed bottom-4 left-[50%] z-50 flex w-full max-w-[calc(100%-2rem)] translate-x-[-50%] flex-col gap-4 rounded-lg border p-6 shadow-lg ring-0 outline-0 transition-transform sm:max-w-2xl sm:flex-row",
      jiggling ? "bg-destructive" : "bg-background",
    )}
    class:shaking={jiggling}
  >
    <p>You got unsaved changes mate.</p>
    <div class="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" class="w-1/2 sm:w-33" onclick={discardChanges}>Discard</Button>
      <Button variant="success" class="w-1/2 sm:w-33" onclick={saveData}>Save</Button>
    </div>
  </div>
</Portal>

<style>
  @keyframes jiggle {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(12px);
    }
    50% {
      transform: translateX(-12px);
    }
    75% {
      transform: translateX(12px);
    }
    100% {
      transform: translateX(0);
    }
  }

  .shaking {
    animation: jiggle 250ms ease-in-out infinite;
  }

  [data-type="savealert"] {
    transition-property: background-color, transform;
    transition-duration: 100ms, 100ms;
  }
</style>
