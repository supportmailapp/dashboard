<script lang="ts">
  import { cn } from "$lib/utils";
  import Files from "@lucide/svelte/icons/files";
  import Trash from "@lucide/svelte/icons/trash";
  import { toast } from "svelte-sonner";

  type Props = {
    id?: string;
    hovered: boolean;
    onDelete?: (id: string) => boolean | Promise<boolean>;
    buttons?: "delete" | "copy" | "all" | "none";
  };

  let { hovered = $bindable(false), id, buttons = "all", onDelete }: Props = $props();

  function copyId() {
    if (!id) return;

    navigator.clipboard
      .writeText(id)
      .then(() => {
        // Optionally show a success message or feedback
        toast.success(`✅ ID copied: ${id}`, {
          duration: 2000,
        });
      })
      .catch((error) => {
        toast.error("Failed to copy ID");
        throw new Error(`Failed to copy ID: ${error.message}`);
      });
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class={cn("actions-container", "rounded-md")} onclick={(e) => e.stopPropagation()}>
  {#if buttons === "all" || buttons === "delete"}
    <button
      class="text-destructive bg-destructive-foreground"
      class:visible={hovered}
      onclick={async () => {
        if (!id) return;
        await onDelete?.(id);
      }}
    >
      <Trash class="w-4" />
    </button>
  {/if}
  {#if buttons === "all" || buttons === "copy"}
    <button class="text-primary bg-primary-foreground" class:visible={hovered} onclick={copyId}>
      <Files class="w-4" />
    </button>
  {/if}
</div>
