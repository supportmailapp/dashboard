<script lang="ts">
  import { MarkdownFormatter } from "$lib/utils/formatting";
  import * as AlertDialog from "$ui/alert-dialog/index.js";

  interface Props {
    title?: string;
    /**
     * Optional description for the dialog.
     *
     * Can be markdown.
     */
    description?: string;
    onYes: () => void;
    disabled?: boolean;
    children: import("svelte").Snippet;
  }

  let {
    title = "Are you absolutely sure?",
    description,
    onYes,
    disabled = false,
    children,
  }: Props = $props();

  const htmlDescription = description ? new MarkdownFormatter(description).toHTML() : undefined;
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger {disabled}>
    {@render children()}
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{title}</AlertDialog.Title>
      {#if htmlDescription}
        <AlertDialog.Description>
          {@html htmlDescription}
        </AlertDialog.Description>
      {/if}
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>No</AlertDialog.Cancel>
      <AlertDialog.Action onclick={onYes} {disabled}>Yes</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
