<script lang="ts">
  import { page } from "$app/state";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { LANGUAGES } from "$lib/constants";
  import { APIRoutes } from "$lib/urls";
  import { cn, determineUnsavedChanges, parseIconToURL } from "$lib/utils";
  import { Button } from "$ui/button";
  import * as Select from "$ui/select/index.js";
  import * as Field from "$ui/field/index.js";
  import { Switch } from "$ui/switch";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import { toast } from "svelte-sonner";
  import apiClient from "$lib/utils/apiClient";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import { onMount } from "svelte";
  import Files from "@lucide/svelte/icons/files";

  interface OurUser {
    language: string;
    autoRedirect: boolean;
  }

  let loading = $state(true);
  let oldUser = null as OurUser | null;
  let dbUser = $state<OurUser | null>(null);
  const dcUser = $derived(page.data.user);
  let goingBack = $state(false);
  let unsavedChanges = $derived(determineUnsavedChanges(oldUser, dbUser));

  const triggerContent = $derived(
    LANGUAGES.find((f) => f.value === dbUser?.language)?.name ?? "Select a langauge",
  );

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

  async function saveCfg() {
    if (!dbUser) return;
    loading = true;

    const res = await apiClient.patch<OurUser>(APIRoutes.me(), {
      json: $state.snapshot(dbUser),
    });

    const jsonRes = await res.json();
    if (!res.ok) {
      toast.error(`Failed to save settings: ${(jsonRes as any).message ?? res.statusText}`);
    } else {
      oldUser = { ...jsonRes };
      dbUser = { ...jsonRes };
      toast.success("Settings saved!");
    }
    loading = false;
  }

  function discardChanges() {
    if (!oldUser) return;
    dbUser = { ...oldUser! };
  }

  onMount(async () => {
    loading = true;
    const res = await apiClient.get<OurUser>(APIRoutes.me());
    const jsonRes = await res.json();
    if (res.ok) {
      oldUser = { ...jsonRes };
      dbUser = { ...jsonRes };
    } else {
      toast.error(`Failed to load settings: ${(jsonRes as any).message ?? res.statusText}`);
    }
    loading = false;
  });
</script>

<SaveAlert saving={loading} {discardChanges} saveData={saveCfg} {unsavedChanges} />

<div class="mx-auto max-w-full space-y-5 px-2 py-4 sm:max-w-3xl sm:py-6">
  <Button
    variant="outline"
    onclick={() => {
      goingBack = true;
      history.back();
    }}
  >
    <ChevronLeft class="size-4" />
    Back
  </Button>
  <div>
    {#if profile.banner}
      <img
        class="border-base-800 aspect-3/1 w-full rounded-xl border object-cover"
        src={profile.banner}
        alt="User Avatar"
      />
    {:else}
      <div
        class="border-base-800 aspect-4/1 w-full rounded-xl border object-cover"
        style="background-color: {profile.accentHex ?? 'var(--color-slate-700)'};"
      ></div>
    {/if}
  </div>

  <div class="-mt-14 flex max-w-full items-end space-x-5 overflow-clip rounded-lg px-6">
    <div class="border-background mb-4 size-24 overflow-hidden rounded-full border-4 shadow-lg">
      <img src={profile.avatar} alt="User Avatar" class="object-cover" />
    </div>
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
            <Files class="size-3" />
          </Button>
        {:else}
          <small class="h-fit p-1 text-xs text-gray-400">Unknown ID</small>
        {/if}
      </div>
    </div>
  </div>

  <Field.Set class="flex flex-col gap-2">
    <Field.Legend>Preferences</Field.Legend>
    {#if dbUser}
      <Field.Group>
        <Field.Field class="rounded p-2">
          <Field.Label for="language">Language</Field.Label>
          <Select.Root type="single" name="language" bind:value={dbUser.language}>
            <Select.Trigger id="language" class="w-full max-w-3xs">
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
          <Field.Description>Select your preferred language for the bot responses.</Field.Description>
        </Field.Field>

        <Field.Separator />

        <Field.Field orientation="horizontal" class="rounded p-2">
          <Field.Content>
            <Field.Label>
              <Switch bind:checked={dbUser.autoRedirect} variant="success" />
              Use automatic ticket redirect
            </Field.Label>
            <Field.Description>
              <div class="text-sm">
                When enabled, the bot will automatically send DM messages to your most recent ticket without
                asking for confirmation.
              </div>
              <div class="text-sm">
                When managing multiple open tickets across different servers, use the <span class="font-mono"
                  >/ticket-create</span
                > command to create new tickets.
              </div>
            </Field.Description>
          </Field.Content>
        </Field.Field>
      </Field.Group>
    {:else}
      <LoadingSpinner size="10" />
    {/if}
  </Field.Set>

  <!-- TODO: Implement subscriptions for the user in another Field.Set -->
</div>
