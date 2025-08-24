<script lang="ts">
  import { Avatar } from "@fuxui/base";

  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { LANGUAGES } from "$lib/constants";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes } from "$lib/urls";
  import { parseIconToURL } from "$lib/utils";
  import { Button } from "$ui/button";
  import { Label } from "$ui/label";
  import * as Select from "$ui/select/index.js";
  import { Switch } from "$ui/switch";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ky from "ky";
  import { toast } from "svelte-sonner";

  const user = new ConfigState<{ language: string; autoRedirect: boolean }>(null);
  const dcUser = $derived(page.data.user);
  let goingBack = $state(false);

  const triggerContent = $derived(
    LANGUAGES.find((f) => f.value === user?.config?.language)?.name ?? "Select a langauge",
  );

  $inspect("triggerContent", triggerContent);
  $inspect("user", user.config);

  type Profile = {
    banner?: string;
    avatar?: string;
    displayName?: string;
    handle?: string;
    description?: string;
    accentHex?: string;
  };

  const profile = $derived<Profile>({
    avatar: parseIconToURL(dcUser?.avatar, dcUser?.id ?? "", "user", 256),
    handle: `@${dcUser?.username}`,
    displayName: dcUser?.global_name ?? dcUser?.username,
    accentHex: "#" + dcUser?.accent_color?.toString(16).padStart(6, "0"),
    banner: dcUser?.banner ? parseIconToURL(dcUser.banner, dcUser.id, "banner") : undefined,
  });

  async function saveFn() {
    if (!user.evalUnsaved()) {
      toast.info("Nothing to save!");
      return;
    }

    user.saving = true;
    const snap = user.snap();
    try {
      if (!snap) {
        throw new Error("Data not set");
      }

      const res = await ky.put(APIRoutes.me(), {
        json: user.snap(),
      });
      if (!res.ok) {
        const err = await res.json<APIError>();
        throw new Error(err.message);
      }
      const json = await res.json<any>();
      user.saveConfig(json);
      toast.success("Settings successfully saved.");
    } catch (err: any) {
      toast.error(err?.message ?? "Something sent wrong while saving...");
      user.saving = false;
    }
  }

  $effect(() => {
    fetch(APIRoutes.me())
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text().catch(() => `${res.status} ${res.statusText}`);
          throw new Error(`Error while fetching data: ${errText}`);
        }
        const json = (await res.json()) as any;
        console.log("json res:", json);
        user.saveConfig(json);
      })
      .catch((err) => {
        toast.error(err?.message ?? "Something sent wrong while fetching data...");
      });
  });
</script>

<div class="mx-auto max-w-full space-y-5 px-2 py-4 sm:max-w-2xl sm:py-6">
  <Button
    variant="outline"
    onclick={() => {
      goingBack = true;
      goto(
        page.url.searchParams.get("back")?.startsWith("/") ? page.url.searchParams.get("back")! : "/",
      ).finally(() => {
        goingBack = false;
      });
    }}
  >
    <ChevronLeft class="size-4" />
    Back
  </Button>
  {#if !goingBack}
    <div>
      {#if profile.banner}
        <img
          class="border-base-800 aspect-[3/1] w-full rounded-xl border object-cover"
          src={profile.banner}
          alt="User Avatar"
        />
      {:else}
        <div
          class="border-base-800 aspect-[4/1] w-full rounded-xl border object-cover"
          style="background-color: {profile.accentHex ?? 'var(--color-slate-700)'};"
        ></div>
      {/if}
    </div>
    <div class="-mt-14 flex max-w-full items-end space-x-5 overflow-clip rounded-lg px-6">
      <Avatar src={profile.avatar} class="border-base-50 dark:border-base-950 mb-4 size-24 border-2" />
      <div class="flex min-w-0 flex-1 items-center justify-end space-x-6 pb-1">
        <div class="mt-0 flex max-w-full min-w-0 flex-1 flex-col items-baseline">
          <h1 class="text-base-900 dark:text-base-100 max-w-full truncate text-lg font-bold">
            {profile.displayName || profile.handle}
          </h1>
          <div class="text-base-900 dark:text-base-400 truncate text-sm">
            {profile.handle}
          </div>
          {#if dcUser?.id}
            <Button
              variant="ghost"
              class="h-fit p-1 text-xs text-gray-400"
              onclick={async () => {
                if (!dcUser?.id) return;
                await navigator.clipboard?.writeText(dcUser?.id);
                toast.success("Copied your User ID!");
              }}
            >
              {dcUser?.id}
            </Button>
          {:else}
            <small class="h-fit p-1 text-xs text-gray-400">Unknown ID</small>
          {/if}
        </div>
      </div>
    </div>
    <ConfigCard title="Preferences" {saveFn} class="flex flex-col gap-2">
      {#if user.isConfigured()}
        <Select.Root type="single" name="language" bind:value={user.config.language}>
          <Select.Trigger class="w-full max-w-3xs">
            {triggerContent}
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.Label>Languages</Select.Label>
              {#each LANGUAGES as lang (lang.value)}
                <Select.Item value={lang.value} label={lang.name}>
                  {lang.name}
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
        <Label
          class="hover:bg-accent/50 has-[[aria-checked=true]]:border-accent has-[[aria-checked=true]]:bg-accent/50 flex items-start gap-3 rounded-lg border p-3"
        >
          <Switch id="toggle-2" bind:checked={user.config.autoRedirect} variant="success" />
          <div class="grid gap-1.5 font-normal">
            <p class="text-sm leading-none font-medium">Automatic Redirect</p>
            <p class="text-muted-foreground text-sm">
              When enabled, the bot will automatically send DM messages to your most recent ticket without
              asking for confirmation.
            </p>
            <p class="text-muted-foreground text-sm">
              When managing multiple open tickets across different servers, use the <span class="font-mono"
                >/ticket-create</span
              > command to create new tickets.
            </p>
          </div>
        </Label>
      {:else}
        <LoadingSpinner size="10" />
      {/if}
    </ConfigCard>
  {:else}
    <LoadingSpinner class="mx-auto size-20" />
  {/if}
</div>
