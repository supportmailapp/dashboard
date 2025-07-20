<script lang="ts">
  import { cn } from "$lib/utils";
  import Files from "@lucide/svelte/icons/files";
  import Trash from "@lucide/svelte/icons/trash";
  import { toast } from "svelte-sonner";

  type Props = { id?: string; hovered: boolean; onDelete?: (id: string) => boolean | Promise<boolean> };

  let { hovered = $bindable(false), id, onDelete }: Props = $props();

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

<div class={cn("actions-container", "rounded-md")}>
  <button
    class="action-delete"
    class:visible={hovered}
    onclick={async () => {
      if (!id) return;
      await onDelete?.(id);
    }}
  >
    <Trash class="w-4" />
  </button>
  <button class="action-copy" class:visible={hovered} onclick={copyId}>
    <Files class="w-4" />
  </button>
</div>
