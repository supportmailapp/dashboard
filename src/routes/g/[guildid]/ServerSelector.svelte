<script lang="ts">
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { site } from "$lib/stores/site.svelte";
  import * as Dialog from "$ui/dialog/index.js";
  import ServerSelect from "../../ServerSelect.svelte";

  let {
    open = $bindable(false),
    switchingPage = $bindable(false),
  }: { open: boolean; switchingPage?: boolean } = $props();
</script>

<Dialog.Root bind:open>
  <!-- <Dialog.Overlay class="bg-overlay fixed inset-0 z-50" /> -->
  <Dialog.Content class="md:min-w-[450px]">
    <Dialog.Header>
      <Dialog.Title>Select a Server</Dialog.Title>
      <Dialog.Description>Choose a server from the list below.</Dialog.Description>
    </Dialog.Header>
    {#if site.showLoading}
      <div class="grid h-100 place-items-center">
        <LoadingSpinner class="size-20" />
      </div>
    {:else}
      <ServerSelect clickFn={() => (switchingPage = true)} />
    {/if}
  </Dialog.Content>
</Dialog.Root>
