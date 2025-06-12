<script lang="ts">
  import * as Alert from "$ui/alert/index.js";
  import { Button } from "$ui/button/index.js";
  import * as Card from "$ui/card/index.js";
  import { enhance } from "$app/forms";
  import Branding from "$lib/assets/Branding.svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  let showLoading = $state(false);
  let error = $state<string | null>(null);

  onMount(async () => {
    if (page.url.searchParams.has("error")) {
      error = page.url.searchParams.get("error") || "An unknown error occurred.";
      console.error("Login error:", error);
      showLoading = false;
      await goto("/login", { replaceState: true });
    }
  });
</script>

<div id="bg" style="background-image: url(https://picsum.photos/1920/1080.webp);"></div>
<a
  href="https://picsum.photos/"
  target="_blank"
  rel="noopener noreferrer"
  class="text-opacity-50 absolute right-3 bottom-3 z-50 text-[0.6rem] text-slate-600 hover:text-slate-400"
>
  Photo by <b>Picsum Photos</b>
</a>

<div class="flex h-screen flex-col items-center justify-center gap-6 px-3">
  {#if !!error}
    <Alert.Root class="w-full max-w-md" variant="destructive">
      <Alert.Title>An error occurred!</Alert.Title>
      <Alert.Description>
        {error}
      </Alert.Description>
    </Alert.Root>
  {/if}

  <Card.Root class="w-full max-w-md shadow-xl shadow-black/50 select-none">
    <Card.Header class="text-center">
      <Branding />
    </Card.Header>
    <Card.Content>
      <form
        class="grid place-items-center gap-6"
        method="POST"
        use:enhance={() => {
          showLoading = true;
          return ({ result }) => {
            console.log("Login result:", result);
            if (result.type === "success") {
              open((result.data?.url as string) || "/", "_self");
            } else {
              showLoading = false;
            }
          };
        }}
      >
        <Button type="submit" class="w-full max-w-xs" disabled={showLoading}>
          {#if showLoading}
            <div class="size-5 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          {:else}
            <img src="/icons/discord-mark-white.svg" alt="Discord Logo" class="h-8 w-8" />
          {/if}

          <span class="text-lg text-white">{showLoading ? "Logging in..." : "Login with Discord"}</span>
        </Button>
      </form>
    </Card.Content>
  </Card.Root>
</div>

<style>
  #bg {
    width: 100%;
    height: 100%;
    position: absolute;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    object-fit: cover;
    backdrop-filter: blur(0.75vh);
    filter: blur(0.75vh);
    -webkit-filter: blur(0.75vh);
    box-shadow: 0 0 200px rgba(0, 0, 0, 0.9) inset;
    z-index: -1;
  }
</style>
