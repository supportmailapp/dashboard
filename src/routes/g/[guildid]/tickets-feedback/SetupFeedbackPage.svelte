<script lang="ts">
  import { page } from "$app/state";
  import * as Card from "$ui/card/index.js";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { APIRoutes } from "$lib/urls";
  import apiClient from "$lib/utils/apiClient";
  import * as Dialog from "$ui/dialog";
  import { toast } from "svelte-sonner";
  import { Button } from "$ui/button";

  // Since this page is only intended to be shown, when the postId and tags are not set, we can just refresh the page and everything else is handled automatically
  let setupBtnLoading = $state(false);
  let waitModalOpen = $state(false);

  async function setupFn() {
    try {
      waitModalOpen = true;
      const res = await apiClient.post(APIRoutes.ticketFeedbackSetup(page.data.guildId!), {
        json: {},
      });

      if (!res.ok) {
        const errJson = await res.json<any>();
        const errText = errJson?.message || "Unknown Error";
        throw new Error(errText);
      }

      location.reload();
    } catch (err: any) {
      toast.error("Setup failed.", {
        description: String(err.message ?? err),
      });
      setupBtnLoading = false;
    }
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Setup Feedback</Card.Title>
  </Card.Header>
  <Card.Content>
    <p>To start feedback, the bot has to create the tags in the forum and store them in the database.</p>
  </Card.Content>
  <Card.Footer class="justify-end">
    <Button
      variant="default"
      disabled={setupBtnLoading}
      showLoading={setupBtnLoading}
      class="w-[100px]"
      onclick={setupFn}
    >
      Start Setup
    </Button>
  </Card.Footer>
</Card.Root>

<Dialog.Root bind:open={() => waitModalOpen, () => {}}>
  <Dialog.Content withX={false}>
    <div class="inline-flex items-center gap-5">
      <LoadingSpinner class="size-8" />
      <div class="block">
        <p class="text-lg font-semibold">The setup has started.</p>
        <p class="text-base">Please wait a moment, we are doing some magic...</p>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
