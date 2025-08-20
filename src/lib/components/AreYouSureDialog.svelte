<script lang="ts">
  import { MarkdownFormatter } from "$lib/utils/formatting";
  import * as AlertDialog from "$ui/alert-dialog/index.js";
  import type { Snippet } from "svelte";

  interface Props {
    onYes: () => void;
    title?: string;
    /**
     * Optional description for the dialog.
     *
     * Can be markdown.
     */
    description?: string;
    disabled?: boolean;
    children?: Snippet;
    child?: Snippet;
    open?: boolean;
  }

  let {
    onYes,
    title = "Are you absolutely sure?",
    description,
    disabled = false,
    open = $bindable(false),
    children,
    child,
  }: Props = $props();

  const htmlDescription = description ? new MarkdownFormatter(description).toHTML() : undefined;
</script>

<AlertDialog.Root bind:open>
  {#if child}
    {@render child()}
  {:else if children}
    <AlertDialog.Trigger {disabled}>
      {@render children()}
    </AlertDialog.Trigger>
  {/if}
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
