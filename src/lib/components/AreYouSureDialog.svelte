<script lang="ts">
  import * as AlertDialog from "$ui/alert-dialog/index.js";

  interface Props {
    title?: string;
    description?: string;
    onYes: () => void;
    disabled?: boolean;
    children: import("svelte").Snippet;
  }

  let { title = "Are you absolutely sure?", description, onYes, disabled = false, children }: Props = $props();
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger {disabled}>
    {@render children()}
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{title}</AlertDialog.Title>
      {#if description}
        <AlertDialog.Description>
          {@html description}
        </AlertDialog.Description>
      {/if}
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>No</AlertDialog.Cancel>
      <AlertDialog.Action onclick={onYes} {disabled}>
        Yes
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
