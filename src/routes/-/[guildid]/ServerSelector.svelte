<script lang="ts">
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import * as Dialog from "$ui/dialog/index.js";
  import { slide } from "svelte/transition";
  import ServerSelect from "../../ServerSelect.svelte";
  import { CardContent } from "$ui/card";

  let { open = $bindable(false) }: { open?: boolean; switchingPage?: boolean } = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="bg-background flex h-[40rem] flex-col gap-2 md:min-w-[450px]">
    <Dialog.Header>
      <Dialog.Title>Select a Server</Dialog.Title>
      <Dialog.Description>Choose a server from the list below.</Dialog.Description>
    </Dialog.Header>
    <CardContent class="flex min-h-0 flex-1 flex-col px-0">
      <ServerSelect />
    </CardContent>
  </Dialog.Content>
</Dialog.Root>
