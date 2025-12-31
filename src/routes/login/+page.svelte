<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import Branding from "$lib/assets/Branding.svelte";
  import BackgroundImage from "$lib/components/BackgroundImage.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import * as Alert from "$ui/alert/index.js";
  import { Button } from "$ui/button/index.js";
  import * as Card from "$ui/card/index.js";
  import { onMount } from "svelte";

  const errors = {
    invalid_session: "Invalid Session or expired.",
    oauth_error: "OAuth Error.",
    access_denied: "Access Denied. You must authorize the application to log in.",
    "error4xx": "A client error occurred during login.",
    token_exchange_failed: "Failed to exchange authorization code for tokens.",
    user_fetch_failed: "Failed to fetch user information.",
    unknown: "An unknown error occurred.",
  };

  let showLoading = $state(false);
  let error = $state({
    msg: "",
    description: "",
  });

  onMount(async () => {
    if (page.url.searchParams.has("error")) {
      error = {
        msg: errors[page.url.searchParams.get("error") as keyof typeof errors] || errors.unknown,
        description: page.url.searchParams.get("error_description") || "",
      };
      console.error("Login error:", error);
      showLoading = false;
      await goto("/login", { replaceState: true });
    }
  });
</script>

<BackgroundImage />

<div class="flex h-screen flex-col items-center justify-center gap-6 px-3">
  {#if !!error}
    <Alert.Root class="w-full max-w-md" variant="destructive">
      <Alert.Title>{error.msg}</Alert.Title>
      <Alert.Description>
        {error.description}
      </Alert.Description>
    </Alert.Root>
  {/if}

  <Card.Root class="w-full max-w-md shadow-xl shadow-black/60 select-none backdrop-blur-md bg-transparent border-none">
    <Card.Header class="text-center">
      <Branding />
    </Card.Header>
    <Card.Content>
      <form
        class="grid place-items-center gap-6"
        action="?/login"
        method="POST"
        use:enhance={() => {
          const nextHref = page.url.searchParams.get("next");
          if (nextHref?.startsWith("/g/")) {
            localStorage.setItem("urlAfterLogin", nextHref);
          } else if (nextHref?.startsWith("/")) {
            localStorage.setItem("urlAfterServerSelection", nextHref);
          }

          showLoading = true;

          return async ({ update, result }) => {
            console.log("Form submitted", result);
            await update();
            if (result.type === "success" && result.data) {
              open(result.data.url as string, "_self");
            } else {
              console.error("Error during login");
            }
            showLoading = false;
          };
        }}
      >
        <Button type="submit" class="w-full max-w-xs hover:scale-102" disabled={showLoading}>
          {#if showLoading}
            <LoadingSpinner size="8" />
          {:else}
            <img src="/icons/discord-mark-white.svg" alt="Discord Logo" class="size-8" />
          {/if}

          <span class="text-lg text-white">{showLoading ? "Logging in..." : "Login with Discord"}</span>
        </Button>
      </form>
    </Card.Content>
  </Card.Root>
</div>
