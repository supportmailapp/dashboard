<script lang="ts">
  import { page } from "$app/state";
  import CheckIcon from "@lucide/svelte/icons/check";
  import * as Command from "$lib/components/ui/command/index.js";
  import { LANGUAGES } from "$lib/constants";
  import { DataManager } from "$stores/DataManager.svelte";
  import { APIRoutes, DocsLinks } from "$lib/urls";
  import { userDisplayName } from "$lib/utils/formatting";
  import * as Card from "$ui/card/index.js";
  import { toast } from "svelte-sonner";
  import { cn } from "$lib/utils";
  import { onMount } from "svelte";
  import ky from "ky";
  import type { IDBGuild } from "supportmail-types";
  import { Button } from "$ui/button";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { Skeleton } from "$ui/skeleton";

  const dataManager = new DataManager();
  let currentLanguage = $state<(typeof LANGUAGES)[number]["value"] | null>(null);

  $effect(() => {
    console.log("Current language:", $state.snapshot(currentLanguage));
  });

  dataManager.save = async function () {
    dataManager.saveProgress = 20;
    try {
      const res = await ky.patch(APIRoutes.guildConfig(page.data.guildId!), {
        json: { language: currentLanguage },
      });
      if (!res.ok) {
        const errJson = await res.json<any>();
        const errText = errJson?.message || "Unknown Error";
        throw new Error(errText);
      }
      toast.success("Guild configuration saved successfully!", {
        description: "The language has been updated.",
      });
    } catch (err: any) {
      toast.error("Failed to save guild configuration.", {
        description: err.message,
      });
    } finally {
      dataManager.saveProgress = 100;
    }
  };

  onMount(async () => {
    const res = await fetch(APIRoutes.guildConfig(page.data.guildId!));
    if (!res.ok) {
      toast.error("Failed to load guild configuration.", {
        description: "Please try again later.",
      });
      return;
    }
    const jsonRes = (await res.json()) as IDBGuild;
    currentLanguage = jsonRes.lang as any;
  });
</script>

<!-- This page holds the home view for a specific guild; language setting can be changed here -->
<section class="w-full max-w-2xl space-y-3 text-balance">
  <h1 class="text-3xl font-bold">
    Welcome <span class="from-primary to-secondary mx-0.5 bg-gradient-to-br bg-clip-text text-transparent">
      {userDisplayName(page.data.user)}
    </span>!
  </h1>
  <p class="text-muted-foreground text-xl">
    Welcome to your SupportMail dashboard! Here you can manage your Discord server's support ticket system and
    configure settings.
  </p>
</section>

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
    {#if !!currentLanguage}
      <Card.Content>
        <Command.Root>
          <Command.Input placeholder="Search language..." />
          <Command.List>
            <Command.Empty>Language not found</Command.Empty>
            <Command.Group value="languages">
              {#each LANGUAGES as lang (lang.value)}
                <Command.Item
                  value={lang.name}
                  onSelect={() => {
                    currentLanguage = lang.value;
                  }}
                >
                  <CheckIcon class={cn(currentLanguage !== lang.value && "text-transparent")} />
                  {lang.name}
                </Command.Item>
              {/each}
            </Command.Group>
          </Command.List>
        </Command.Root>
      </Card.Content>
      <Card.Footer class="flex-col gap-2">
        <Button
          onclick={dataManager.save}
          disabled={dataManager.saving}
          showLoading={dataManager.saving}
          class="w-2xs"
        >
          Save
        </Button>
      </Card.Footer>
    {:else}
      <div class="flex h-32 flex-col justify-center gap-1 px-6">
        <Skeleton class="h-7 w-full rounded-lg" />
      </div>
    {/if}
  </Card.Root>
</section>
