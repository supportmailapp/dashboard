<script lang="ts">
  import { page } from "$app/state";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import * as Command from "$lib/components/ui/command/index.js";
  import { LANGUAGES } from "$lib/constants";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes, DocsLinks } from "$lib/urls";
  import { cn } from "$lib/utils";
  import { userDisplayName } from "$lib/utils/formatting";
  import { Button } from "$ui/button";
  import * as Card from "$ui/card/index.js";
  import { Skeleton } from "$ui/skeleton";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ky from "ky";
  import { toast } from "svelte-sonner";

  const languageConf = new ConfigState<string>(null);

  async function saveLanguage() {
    languageConf.saving = true;
    const lang = languageConf.snap();
    console.log("lang", lang);
    try {
      if (!lang) {
        throw new Error("The language is not set. What da hell?");
      }

      const res = await ky.patch(APIRoutes.guildConfig(page.data.guildId!), {
        json: { language: lang },
      });

      if (!res.ok) {
        const errJson = await res.json<any>();
        const errText = errJson?.message || "Unknown Error";
        throw new Error(errText);
      }

      languageConf.saveConfig(lang);
      toast.success("Guild configuration saved successfully!", {
        description: "The language has been updated.",
      });
    } catch (err: any) {
      toast.error("Failed to save guild configuration.", {
        description: err.message,
      });
    } finally {
      languageConf.saving = false;
    }
  }

  $effect(() => {
    fetch(APIRoutes.guildConfig(page.data.guildId!))
      .then((res) => {
        if (!res.ok) {
          toast.error("Failed to load guild configuration.", {
            description: "Please try again later.",
          });
          return;
        }
        res.json().then((data: string) => {
          languageConf.setConfig(data);
          languageConf.loading = false;
        });
      })
      .catch((err) => {
        toast.error("Failed to load guild configuration.", {
          description: err.message,
        });
      });
  });
</script>

<!-- This page holds the home view for a specific guild; language setting can be changed here -->
<SiteHeading>
  {#snippet title()}
    Welcome <span class="from-primary to-secondary mx-0.5 bg-gradient-to-br bg-clip-text text-transparent">
      {userDisplayName(page.data.user)}
    </span>!
  {/snippet}
  <p class="text-muted-foreground text-xl">
    Welcome to your SupportMail dashboard! Here you can manage your Discord server's support ticket system and
    configure settings.
  </p>
</SiteHeading>

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
    {#if !!languageConf}
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
                    languageConf.setConfig(lang.value);
                    languageConf.evalUnsaved();
                  }}
                >
                  <CheckIcon class={cn(languageConf.config !== lang.value && "text-transparent")} />
                  {lang.name}
                </Command.Item>
              {/each}
            </Command.Group>
          </Command.List>
        </Command.Root>
      </Card.Content>
      <Card.Footer class="flex-col gap-2">
        <Button
          onclick={saveLanguage}
          disabled={languageConf.saving || !languageConf.unsaved}
          showLoading={languageConf.loading}
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
