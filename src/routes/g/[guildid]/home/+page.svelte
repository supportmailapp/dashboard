<script lang="ts">
  import { page } from "$app/state";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import * as Select from "$ui/select/index.js";
  import { LANGUAGES } from "$lib/constants";
  import { APIRoutes, DocsLinks } from "$lib/urls";
  import { cn } from "$lib/utils";
  import { userDisplayName } from "$lib/utils/formatting";
  import { buttonVariants } from "$ui/button";
  import * as Card from "$ui/card/index.js";
  import { Skeleton } from "$ui/skeleton";
  import { toast } from "svelte-sonner";
  import { onDestroy, onMount, untrack } from "svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import apiClient from "$lib/utils/apiClient";
  import type { OverviewConfig } from "$v1Api/assertions";
  import equal from "fast-deep-equal/es6";

  const config = $state({
    old: null as OverviewConfig | null,
    current: null as OverviewConfig | null,
    saving: false,
    loading: false,
  });
  let unsavedChanges = $derived(!equal(untrack(() => config.old), config.current));

  async function saveFn() {
    if (!config.current) {
      toast.error("No configuration to save.");
      return;
    }

    config.saving = true;
    const res = await apiClient.put<OverviewConfig>(
      APIRoutes.overview(page.params.guildid!),
      { json: $state.snapshot(config.current) },
    );

    const _data = await res.json();
    if (res.ok) {
      config.old = { ..._data };
      config.current = { ..._data };
      toast.success("Configuration saved successfully.");
    } else {
      toast.error(`Failed to save configuration: ${(_data as any).message}`);
    }
    config.saving = false;
  }

  onMount(async () => {
    const initialRes = await apiClient.get<OverviewConfig>(APIRoutes.overview(page.params.guildid!));

    const _data = await initialRes.json();
    if (initialRes.ok) {
      config.old = {..._data};
      config.current = {..._data};
    } else {
      toast.error(`Failed to load configuration: ${(_data as any).message}`);
    }
    config.loading = false;
  });

  function resetCfg() {
    if (config.old && config.current) {
      config.current = { ...config.old };
    }
  }

  onDestroy(resetCfg);
</script>

<!-- This page holds the home view for a specific guild; language setting can be changed here -->
<SiteHeading
  title="Home"
  subtitle="Welcome to your SupportMail dashboard! Here you can manage your Discord server's support ticket system and configure settings."
>
  {#snippet realTitle()}
    Welcome <span class="from-primary to-secondary mx-0.5 bg-linear-to-br bg-clip-text text-transparent">
      {userDisplayName(page.data.user)}
    </span>!
  {/snippet}
</SiteHeading>

<SaveAlert
  saving={config.saving}
  unsavedChanges={unsavedChanges}
  discardChanges={() => {
    if (config.old && config.current) {
      config.current = { ...config.old };
    }
  }}
  saveData={saveFn}
/>

<section class="mt-6">
  <Card.Root class="w-full max-w-xl">
    <Card.Header>
      <Card.Title>Language</Card.Title>
      <Card.Description>
        <p>The configured language here applies when:</p>
        <ul class="ml-6 list-disc">
          <li>
            To messages the bot sends publicly in the server (user messages are not translated, this only
            applies to pre-existing messages)
          </li>
          <li>
            To the bot's responses in the support ticket system, <strong
              >if the user doesn't have a language set</strong
            >.
          </li>
          <li>
            <a href={DocsLinks.LanguageDeterminationInGuild} target="_blank" class="link link-hover">
              More information on how the language is determined
            </a>
          </li>
        </ul>
      </Card.Description>
    </Card.Header>
    {#if config.current}
      <Card.Content>
        <Select.Root
          type="single"
          bind:value={config.current.language}
        >
          <Select.Trigger class={cn(buttonVariants({ variant: "outline" }), "w-40 justify-between")}>
            {LANGUAGES.find((lang) => lang.value === config.current!.language)?.name}
          </Select.Trigger>
          <Select.Content>
            {#each LANGUAGES as lang (lang.value)}
              <Select.Item value={lang.value} label={lang.name}>
                {lang.name}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Card.Content>
    {:else}
      <div class="flex h-32 flex-col justify-center gap-1 px-6">
        <Skeleton class="h-7 w-full rounded-lg" />
      </div>
    {/if}
  </Card.Root>
</section>
