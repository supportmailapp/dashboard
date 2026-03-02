<script lang="ts">
  import { page } from "$app/state";
  import Button from "$ui/button/button.svelte";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Home from "@lucide/svelte/icons/home";

  const statusLabels = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  }
  
  const statusMessages = {
    400: "Did you forget how to internet?",
    401: "Nice try, but this isn't for you.",
    403: "You shall not pass! 🧙",
    404: "Even we can't find this page. It's gone. Poof.",
    500: "Our hamsters are tired. Let them rest.",
    502: "The server hiccupped. Technology is hard.",
    503: "We're taking a coffee break. Back soon! (Hopefully)",
    504: "The server is thinking... still thinking... 🤔",
  };

  let error = $derived(page.error?.message || "An unexpected error occurred");
  let statusLabel = $derived(page.status ? statusLabels[page.status as keyof typeof statusLabels] || "Unknown Error" : "Unknown Error");
  let statusText = $derived(page.status ? statusMessages[page.status as keyof typeof statusMessages] || error : error);
</script>

<div class="from-primary/70 to-base-300/20 flex min-h-screen items-center justify-center bg-linear-to-br p-8">
  <div class="text-base-content max-w-2xl text-center">
    <h1 class="text-9xl font-bold text-white drop-shadow-lg md:text-[10rem]">
      {page.status}
    </h1>
    <h2 class="mt-4 text-3xl font-semibold text-white md:text-4xl">
      {statusLabel}
    </h2>
    <p class="mt-6 text-lg text-white/90 md:text-xl">
      {statusText}
    </p>
    {#if page.error?.status}
      <p class="mt-3 text-sm text-white/70">Error code: {page.error.status}</p>
    {/if}
    <div class="mt-8 flex flex-col justify-center items-center gap-3">
      <Button href="/" variant="outline" class="w-70" size="lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clip-rule="evenodd"
          />
        </svg>
        Try Again
      </Button>
      <Button onclick={() => history.back()} variant="secondary" class="w-70" size="lg">
        <ArrowLeft />
        Go Back
      </Button>
      <Button href="/" class="w-70" size="lg">
        <Home />
        Return Home
      </Button>
    </div>
  </div>
</div>
