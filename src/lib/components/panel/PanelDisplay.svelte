<script lang="ts">
  import "$lib/assets/markup.css";
  import type { SMActionRowComponent, SMTopLevelMessageComponent } from "$lib/sm-types/src";
  import { discordMdToHtml } from "$lib/utils/markup";
  import { type APITextDisplayComponent, ComponentType } from "discord-api-types/v10";
  import LoadingSpinner from "../LoadingSpinner.svelte";
  import { buttonStyleClasses } from "./Button.svelte";
  import { cn } from "$lib/utils";
  import { validateEmoji } from "$lib/utils/formatting";
  import twemoji from "@discordapp/twemoji";
  import * as DropdownMenu from "$ui/dropdown-menu/index.js";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import Emoji from "./Emoji.svelte";

  let {
    components,
  }: {
    components?: SMTopLevelMessageComponent[];
  } = $props();
</script>

{#snippet TextDisplay({ content }: APITextDisplayComponent)}
  <div
    {@attach (e) => {
      e.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        const mentionContainer = target.closest("[data-slot='mention-container']");
        if (mentionContainer) {
          const mentionText = mentionContainer.textContent || "";
          navigator.clipboard.writeText(mentionText).then(() => {
            console.log(`Copied mention text to clipboard: ${mentionText}`);
          });
        }

        // If click is on span.spoiler, reveal it
        const spoiler = target.closest("span.spoiler");
        console.log("Clicked element:", target, "Spoiler found:", spoiler);
        if (spoiler) {
          spoiler.classList.add("revealed");
        }
      });
    }}
  >
    {#await discordMdToHtml(content)}
      <LoadingSpinner />
    {:then html}
      {@html html}
    {/await}
  </div>
{/snippet}

{#snippet ActionRow({ components }: SMActionRowComponent)}
  <div class="discord-action-row my-2 flex gap-2">
    {#each components as component}
      {#if component.type === ComponentType.Button}
        <div
          class={cn("max-w-100 gap-2 truncate", buttonStyleClasses.base, buttonStyleClasses[component.style])}
        >
          {#if !!component.emoji && component.emoji.length > 0}
            <Emoji emoji={component.emoji} />
          {/if}
          <span class="font-medium">{component.label}</span>
        </div>
      {:else if component.type === ComponentType.StringSelect}
        {@const hasEmoji = !!component.options.find((opt) => !!opt.emoji && opt.emoji.length > 0)}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger class="discord-select text-muted-foreground w-90 truncate">
            {component.placeholder || "Select an option"}
            <ChevronDown class="ml-auto" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content class="w-90" avoidCollisions={false}>
            {#each component.options as opt}
              <DropdownMenu.Item class="flex flex-row items-center gap-2 p-1.5">
                {#if !!opt.emoji && opt.emoji.length > 0}
                  <Emoji emoji={opt.emoji} />
                {:else if hasEmoji}
                  <div class="w-5"></div>
                {/if}
                <div class="flex w-fit flex-col justify-center px-2 py-1">
                  <p class="text-sm font-semibold text-white">{opt.label}</p>
                  {#if opt.description}
                    <p class="text-sm text-gray-400">{opt.description}</p>
                  {/if}
                </div>
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    {/each}
  </div>
{/snippet}

<div
  style="background-color: rgb(54, 57, 62)"
  class="prose prose-invert discord-message w-full max-w-none overflow-y-auto rounded-lg px-3 py-2"
>
  {#each components as component}
    {#if component.type === ComponentType.ActionRow}
      {@render ActionRow(component)}
    {:else if component.type === ComponentType.TextDisplay}
      {@render TextDisplay(component)}
    {/if}
  {/each}
</div>
