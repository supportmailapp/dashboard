<script lang="ts">
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import * as Dialog from "$ui/dialog/index.js";
  import ServerSelect from "../../ServerSelect.svelte";

  let {
    open = $bindable(false),
    switchingPage = $bindable(false),
  }: { open?: boolean; switchingPage?: boolean } = $props();
</script>

<Dialog.Root {open}>
  <Dialog.Content class="md:min-w-[450px]">
    <Dialog.Header>
      <Dialog.Title>Select a Server</Dialog.Title>
      <Dialog.Description>Choose a server from the list below.</Dialog.Description>
    </Dialog.Header>
    {#if switchingPage}
      <div class="grid h-100 place-items-center">
        <LoadingSpinner class="size-20" />
      </div>
    {:else}
      <ServerSelect />
    {/if}
  </Dialog.Content>
</Dialog.Root>
