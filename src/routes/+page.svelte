<script lang="ts">
  import { beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";
  import Branding from "$lib/assets/Branding.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { cdnUrls, LegalLinks } from "$lib/urls";
  import * as Avatar from "$ui/avatar/index.js";
  import * as Card from "$ui/card/index.js";
  import { Separator } from "$ui/separator/index.js";
  import * as Table from "$ui/table/index.js";
  import ArrowBigRight from "@lucide/svelte/icons/arrow-big-right";
  import Plus from "@lucide/svelte/icons/plus";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";

  let guildManager = $derived(page.data.guildsManager);
  let loading = $state(false);
  let nextPath = $state(
    page.url.searchParams.get("next")?.startsWith("/") ? page.url.searchParams.get("next") : "/home",
  );

  $effect(() => {
    if (guildManager.loaded) {
      loading = false;
    } else {
      loading = true;
    }
  });

  beforeNavigate(({ complete }) => {
    loading = true;
    complete.finally(() => {
      loading = false;
    });
  });

  onMount(async () => {
    if (!page.data.guildsManager.guilds.length) {
      await page.data.guildsManager.loadGuilds();
    }
  });
</script>

<div id="bg" style="background-image: url(https://picsum.photos/1920/1080.webp);"></div>
<a
  href="https://picsum.photos/"
  target="_blank"
  rel="noopener noreferrer"
  class="text-muted hover:text-muted-foreground absolute right-3 bottom-3 z-50 text-[0.6rem]"
>
  Photo by <b>Picsum Photos</b>
</a>

<div class="flex h-screen flex-col items-center justify-center gap-6 p-3">
  <Card.Root
    class="flex max-h-[40rem] w-full max-w-xl flex-col overflow-clip shadow-2xl shadow-black/50 select-none"
  >
    <Card.Header class="shrink-0 text-center">
      <Branding />
    </Card.Header>
    <Card.Content class="flex min-h-0 flex-1 flex-col">
      {#if loading}
        <div
          class="grid h-fit w-full place-items-center py-3"
          transition:slide={{ duration: 200, axis: "x" }}
        >
          <LoadingSpinner size="12" />
        </div>
      {:else}
        <div
          class="min-h-0 flex-1 cursor-pointer overflow-auto"
          transition:slide={{ duration: 200, axis: "x" }}
        >
          <Table.Root>
            <Table.Body>
              {#if guildManager.guilds.length === 0}
                <Table.Row>
                  <Table.Cell>No servers found</Table.Cell>
                </Table.Row>
              {:else}
                {#each guildManager.guilds as guild (guild.id)}
                  <Table.Row
                    class={!guild.isConfigured ? "opacity-50 hover:opacity-100" : ""}
                    onclick={() => goto(`/g/${guild.id}${nextPath}`)}
                  >
                    <!-- Icon, Name, either a PLUS icon or a "login" icon -->
                    <Table.Cell>
                      <Avatar.Root>
                        <Avatar.Fallback>{guild.name}</Avatar.Fallback>
                        <Avatar.Image src={cdnUrls.guildIcon(guild.id, guild.icon, 256)} />
                      </Avatar.Root>
                    </Table.Cell>
                    <Table.Cell>
                      <p class="w-full truncate text-center">{guild.name}</p>
                    </Table.Cell>
                    <Table.Cell>
                      {#if guild.isConfigured}
                        <ArrowBigRight />
                      {:else}
                        <Plus />
                      {/if}
                    </Table.Cell>
                  </Table.Row>
                {/each}
              {/if}
            </Table.Body>
          </Table.Root>
        </div>
      {/if}
    </Card.Content>
    <Card.Footer class="text-muted-foreground flex h-5 shrink-0 flex-row justify-center gap-4 px-3 text-xs">
      <!-- This is actually the footer for this page -->
      <p>&copy; 2025 SupportMail</p>
      <Separator orientation="vertical" />
      <a href={LegalLinks.terms} target="_blank" class="hover:underline">Terms of Service</a>
      <Separator orientation="vertical" />
      <a href={LegalLinks.privacy} target="_blank" class="hover:underline">Privacy Policy</a>
    </Card.Footer>
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
