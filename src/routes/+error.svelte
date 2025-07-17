<script lang="ts">
  import { page } from "$app/state";
  import { Button, buttonVariants } from "$ui/button";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";

  let errorDescription = $derived(getErrorDescription(page.error?.status));

  function getErrorDescription(status: number | undefined): string {
    switch (status) {
      case 404:
        return "The page you're looking for doesn't exist or has been moved.";
      case 403:
        return "You don't have permission to access this resource.";
      case 401:
        return "You need to be logged in to access this resource.";
      case 410:
        return "The resource you are looking for has been permanently removed.";
      case 500:
        return "Something went wrong on our end. We're working to fix it.";
      case 502:
      case 503:
        return "The service is temporarily unavailable. Please try again later.";
      default:
        return "An unexpected error occurred. The developer has been notified.";
    }
  }
</script>

<div class="error-container">
  <h1 class="text-xl font-semibold">You found an error!</h1>
  <p class="text-sm">{errorDescription}</p>

  <div class="w-full max-w-[900px] text-center text-lg text-white">
    <div class="text-warning text-base">
      Error {page.error?.status || "Unknown"}: {page.error?.message || "An error occurred"}
    </div>
    {#if page.error?.id}
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger
            class={buttonVariants({ variant: "ghost", class: "h-fit p-1" })}
            onclick={() => {
              navigator.clipboard
                .writeText(page.error!.id!)
                .then(() => alert("✅ Error ID copied to clipboard!"));
            }}
          >
            ID: {page.error.id}
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>Copy Error ID</p>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
      <p class="mt-2 text-xs text-gray-400">Please include this error ID when reporting the issue.</p>
    {/if}
  </div>

  <div class="flex flex-row gap-2">
    <Button onclick={() => history.back()} class="btn btn-error btn-wide">
      <ArrowLeft />
      Go Back
    </Button>
    <Button variant="secondary" onclick={() => location.reload()} class="btn btn-primary btn-wide">
      <RotateCcw />
      Reload Page
    </Button>
  </div>
</div>

<style>
  .error-container {
    display: flex;
    flex-direction: column;
    text-align: center;
    margin: auto;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 1rem;
    max-width: fit-content;
    width: auto;
    min-height: 100vh;
  }
</style>
