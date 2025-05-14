<script lang="ts">
  import { page } from "$app/state";

  const message = page.error?.message || "An error occurred";
  let description = "";
  let details = "";
  switch (page.status) {
    case 404:
      description = "The page you are looking for does not exist.";
      break;
    case 429:
      description = "You have made too many requests in a short period of time. Please wait.";
      details = `Try again in ${(page.error?.details?.retryAfter / 1000).toFixed(2)} seconds.`;
      break;
    case 500:
      description = "An internal server error occurred.";
      break;
  }
</script>

<div class="xy-center h-full w-full flex-col gap-y-5">
  <h1>{page.status}: {page.error?.message}</h1>
  <p>{description}</p>
  {#if page.error?.details}
    <pre>{details}</pre>
  {/if}
</div>
