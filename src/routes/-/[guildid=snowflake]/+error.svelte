<script lang="ts">
  import { page } from "$app/state";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte";
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import * as Alert from "$ui/alert/index.js";
  import { Button, buttonVariants } from "$ui/button";
  import * as Sidebar from "$ui/sidebar/index.js";
  import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Home from "@lucide/svelte/icons/home";
  import { mode } from "mode-watcher";
  import { fade, slide } from "svelte/transition";

  const statusMessages = {
    400: "Bad Request - Did you forget how to internet?",
    401: "Unauthorized - Nice try, but this isn't for you.",
    403: "Forbidden - You shall not pass! 🧙",
    404: "Not Found - Even we can't find this page. It's gone. Poof.",
    500: "Internal Server Error - Our hamsters are tired. Let them rest.",
    502: "Bad Gateway - The server hiccupped. Technology is hard.",
    503: "Service Unavailable - We're taking a coffee break. Back soon! (Hopefully)",
    504: "Gateway Timeout - The server is thinking... still thinking... 🤔",
  };

  let error = $derived(page.error?.message || "An unexpected error occurred");
  let status = $derived(page.status || 500);
</script>


<div class="flex h-full items-center justify-center">
  <Alert.Root variant="destructive" class="max-w-2xl border-2 [&>svg]:size-5">
    <AlertCircleIcon />
    <Alert.Title class="text-2xl">Error {status}</Alert.Title>
    <Alert.Description class="mt-4 text-base">
      {statusMessages[status as keyof typeof statusMessages] || error}
    </Alert.Description>
    <div class="mt-6 flex gap-3">
      <Button onclick={() => history.back()} variant="outline">
        <ArrowLeft />
        Go Back
      </Button>
      <a href="/" class={buttonVariants({ variant: "default" })}>
        <Home />
        Return Home
      </a>
    </div>
  </Alert.Root>
</div>
