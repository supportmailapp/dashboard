<script lang="ts">
  import { page } from "$app/state";

  let statusText = $derived(
    page.status === 404
      ? "Page Not Found"
      : page.status === 500
        ? "Server Error"
        : page.status === 403
          ? "Forbidden"
          : "Error",
  );

  let errorDescription = $derived(
    page.status === 404
      ? "The page you are looking for does not exist."
      : page.status === 500
        ? "Something went wrong on our end. Please try again later."
        : page.status === 403
          ? "You do not have permission to access this page."
          : "An unexpected error occurred.",
  );
</script>

<div class="bg-linear-to-br from-primary/70 to-base-300/20 flex min-h-screen items-center justify-center p-8">
  <div class="text-base-content max-w-2xl text-center">
    <h1 class="text-9xl font-bold text-white drop-shadow-lg md:text-[10rem]">
      {page.status}
    </h1>
    <h2 class="mt-4 text-3xl font-semibold text-white md:text-4xl">
      {statusText}
    </h2>
    <p class="mt-6 text-lg text-white/90 md:text-xl">
      {page.error?.message || errorDescription}
    </p>
    {#if page.error?.status}
      <p class="mt-3 text-sm text-white/70">Error code: {page.error.status}</p>
    {/if}
    <div class="mt-8 flex flex-col justify-center gap-3">
      <a href="/" class="btn btn-primary btn-lg transition hover:-translate-y-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
          />
        </svg>
        Go to Homepage
      </a>
      <button
        class="btn btn-primary btn-lg transition hover:-translate-y-1"
        onclick={() => location.reload()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clip-rule="evenodd"
          />
        </svg>
        Try Again
      </button>
    </div>
  </div>
</div>