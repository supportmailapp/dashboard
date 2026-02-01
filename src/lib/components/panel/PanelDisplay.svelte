<script lang="ts" module>
  import { SvelteSet } from "svelte/reactivity";
  const clickedSpoilers = new SvelteSet<string>();
  let resetSpoilers = $state(false);

  export function resetClickedSpoilers() {
    clickedSpoilers.clear();
    resetSpoilers = !resetSpoilers;
  }
</script>

<script lang="ts">
  import "$lib/assets/markup.css";
  import type {
    AnySMComponent,
    SMActionRowButton,
    SMActionRowComponent,
    SMContainerComponent,
    SMSectionComponent,
    SMTopLevelMessageComponent,
    SMMediaGalleryComponent,
  } from "$lib/sm-types/src";
  import { discordMdToHtml } from "$lib/utils/markup";
  import {
    type APISeparatorComponent,
    type APITextDisplayComponent,
    ComponentType,
    SeparatorSpacingSize,
  } from "discord-api-types/v10";
  import LoadingSpinner from "../LoadingSpinner.svelte";
  import { buttonStyleClasses } from "./Button.svelte";
  import { cn } from "$lib/utils";
  import { numberToHex } from "$lib/utils/formatting";
  import * as DropdownMenu from "$ui/dropdown-menu/index.js";
  import * as Card from "$ui/card/index.js";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import Emoji from "./Emoji.svelte";
  import { safeParse } from "zod/mini";
  import {
    SeparatorComponentSchema,
    SMActionRowButtonSchema,
    SMActionRowComponentSchema,
    SMContainerComponentSchema,
    SMMediaGalleryComponentSchema,
    SMSectionComponentSchema,
    SMSelectSchema,
    SMMediaItemSchema,
    TextDisplayComponentSchema,
    SMSelectOptionSchema,
  } from "$lib/utils/panelValidators";
  import { Separator as UISeparator } from "$ui/separator";
  import ExternalLink from "@lucide/svelte/icons/external-link";

  let {
    components,
  }: {
    components?: SMTopLevelMessageComponent[];
  } = $props();

  function validateComponent<T extends AnySMComponent>(comp: T): T | null {
    switch (comp.type) {
      case ComponentType.ActionRow: {
        const validChildren = comp.components.map((child) => validateComponent(child)).filter(Boolean);
        if (validChildren.length === 0) return null;
        return safeParse(SMActionRowComponentSchema, { ...comp, components: validChildren }).success
          ? ({ ...comp, components: validChildren } as T)
          : null;
      }
      case ComponentType.Container: {
        const validChildren = comp.components.map((child) => validateComponent(child)).filter(Boolean);
        if (validChildren.length === 0) return null;
        return safeParse(SMContainerComponentSchema, { ...comp, components: validChildren }).success
          ? ({ ...comp, components: validChildren } as T)
          : null;
      }
      case ComponentType.Section: {
        const validChildren = comp.components.map((child) => validateComponent(child)).filter(Boolean);
        if (validChildren.length === 0) return null;
        return safeParse(SMSectionComponentSchema, { ...comp, components: validChildren }).success
          ? ({ ...comp, components: validChildren } as T)
          : null;
      }
      case ComponentType.MediaGallery: {
        const validItems = comp.items.filter((item) => safeParse(SMMediaItemSchema, item).success);
        if (validItems.length === 0) return null;
        return safeParse(SMMediaGalleryComponentSchema, { ...comp, items: validItems }).success
          ? ({ ...comp, items: validItems } as T)
          : null;
      }
      case ComponentType.StringSelect: {
        const validOptions = comp.options.filter((opt) => safeParse(SMSelectOptionSchema, opt).success);
        if (validOptions.length === 0) return null;
        return safeParse(SMSelectSchema, { ...comp, options: validOptions }).success
          ? ({ ...comp, options: validOptions } as T)
          : null;
      }
      case ComponentType.TextDisplay:
        return safeParse(TextDisplayComponentSchema, comp).success ? comp : null;
      case ComponentType.Separator:
        return safeParse(SeparatorComponentSchema, comp).success ? comp : null;
      case ComponentType.Button:
        return safeParse(SMActionRowButtonSchema, comp).success ? comp : null;
      default:
        return null;
    }
  }

  let validComps = $derived(
    (components?.map((c) => validateComponent(c)).filter(Boolean) ?? []) as SMTopLevelMessageComponent[],
  );
  let hasErrors = $derived(components ? components.length !== validComps.length : false);
  let hasMediaGallery = $derived(
    validComps.some(
      (c) =>
        c.type === ComponentType.MediaGallery ||
        (c.type === ComponentType.Container &&
          c.components.some((cc) => cc.type === ComponentType.MediaGallery)),
    ),
  );
</script>

{#snippet TextDisplay(
  { content }: APITextDisplayComponent,
  index: number | string,
  index2: number | string = -1,
)}
  {#key resetSpoilers}
    <div
      id="text-display-{index}-{index2}"
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
            clickedSpoilers.add(`text-display-${index}-${index2}`);
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
  {/key}
{/snippet}

{#snippet Button({ label, style, disabled, emoji }: SMActionRowButton)}
  <div
    class={cn(
      "max-w-100 gap-2 truncate",
      buttonStyleClasses.base,
      buttonStyleClasses[style],
      disabled && "cursor-not-allowed opacity-50",
    )}
  >
    {#if !!emoji && emoji.length > 0}
      <Emoji {emoji} class="me-1 inline" />
    {/if}
    <span class="font-medium">{label}</span>
    {#if style === 5}
      <ExternalLink class="size-4.5" />
    {/if}
  </div>
{/snippet}

{#snippet ActionRow({ components }: SMActionRowComponent)}
  <div class="discord-action-row my-2 flex gap-2">
    {#each components as child}
      {#if child.type === ComponentType.Button}
        {@render Button(child)}
      {:else if child.type === ComponentType.StringSelect}
        {@const hasEmoji = !!child.options.find((opt) => !!opt.emoji && opt.emoji.length > 0)}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger class="discord-select text-muted-foreground w-90 truncate">
            {child.placeholder || "Select an option"}
            <ChevronDown class="ml-auto" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content class="w-90 bg-[#2f3136] p-0" avoidCollisions={false}>
            {#each child.options as opt}
              <DropdownMenu.Item
                class="flex flex-row items-center gap-2 px-2 py-2.5 transition-colors duration-75 ease-in not-first:rounded-t-none not-last:rounded-b-none hover:bg-[#36393f]"
                closeOnSelect={false}
              >
                {#if !!opt.emoji && opt.emoji.length > 0}
                  <Emoji emoji={opt.emoji} />
                {:else if hasEmoji}
                  <div class="w-5"></div>
                {/if}
                <div class="flex w-fit flex-col justify-center">
                  <p class="text-sm font-semibold text-white">{opt.label}</p>
                  {#if opt.description}
                    <p class="text-muted-foreground text-sm">{opt.description}</p>
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

{#snippet Section({ components, accessory }: SMSectionComponent, index: number | string)}
  <div class="flex w-full flex-col gap-2 sm:flex-row">
    <div class="flex flex-1 flex-col gap-2">
      {#each components as td, index2 (index2)}
        {@render TextDisplay(td, index, index2)}
      {/each}
    </div>
    <div>
      {#if accessory && accessory.type === ComponentType.Button}
        {@render Button(accessory)}
      {:else if accessory}
        <img
          src={accessory.url}
          alt={accessory.description || "Media Item"}
          class="size-30 rounded-lg object-cover"
        />
      {/if}
    </div>
  </div>
{/snippet}

{#snippet Separator({ divider, spacing }: APISeparatorComponent)}
  <UISeparator
    class={cn(
      spacing === SeparatorSpacingSize.Small ? "my-1" : divider ? "my-2" : "my-2.5",
      !divider && "bg-transparent",
    )}
  />
{/snippet}

{#snippet MediaGallery({ items }: SMMediaGalleryComponent, index: number | string)}
  {@const gridCols =
    items.length === 1 ? "grid-cols-1" : items.length === 2 ? "grid-cols-2" : "sm:grid-cols-3 grid-cols-2"}
  <div class={cn(`grid max-w-xl gap-2`, gridCols)}>
    {#each items as item, cindex}
      {#if item.spoiler}
        <div class="relative">
          <img src={item.url} alt={item.description || "Media Item"} class="w-full rounded-lg object-cover" />
          {#if !clickedSpoilers.has(`media-gallery-${index}-${cindex}`)}
            <button
              aria-label="Reveal Spoiler"
              class="absolute -inset-px rounded bg-[#1a1a1a]"
              onclick={() => clickedSpoilers.add(`media-gallery-${index}-${cindex}`)}
            ></button>
          {/if}
        </div>
      {:else}
        <img src={item.url} alt={item.description || "Media Item"} class="w-full rounded-lg object-cover" />
      {/if}
    {/each}
  </div>
{/snippet}

{#snippet Container({ accent_color, components, spoiler }: SMContainerComponent, index: number)}
  <div
    id="container-{index}"
    class="container-component relative space-y-1 rounded border px-2 py-1"
    style="--accentColor: {accent_color ? `#${numberToHex(accent_color)}` : 'transparent'};"
  >
    {#each components as ccomponent, cindex}
      {#if ccomponent.type === ComponentType.ActionRow}
        {@render ActionRow(ccomponent)}
      {:else if ccomponent.type === ComponentType.TextDisplay}
        {@render TextDisplay(ccomponent, index, cindex)}
      {:else if ccomponent.type === ComponentType.Section}
        {@render Section(ccomponent, `${index}-${cindex}`)}
      {:else if ccomponent.type === ComponentType.Separator}
        {@render Separator(ccomponent)}
      {:else if ccomponent.type === ComponentType.MediaGallery}
        {@render MediaGallery(ccomponent, cindex)}
      {/if}
    {/each}
    {#if spoiler && !clickedSpoilers.has(`container-${index}`)}
      <button
        aria-label="Reveal Spoiler"
        class="absolute -inset-px rounded bg-[#1a1a1a]"
        onclick={() => clickedSpoilers.add(`container-${index}`)}
      ></button>
    {/if}
  </div>
{/snippet}

{#if hasErrors}
  <Card.Root destructive class="mb-1 p-2">
    <Card.Header class="px-1">
      <Card.Title>There are errors in the components.</Card.Title>
      <Card.Description>
        Only valid components are displayed. Please check your configuration.
      </Card.Description>
    </Card.Header>
  </Card.Root>
{/if}

<div
  class="prose dark:prose-invert discord-message w-full max-w-none overflow-y-auto rounded-lg bg-(--discord-light-background) px-3 py-2 dark:bg-(--discord-dark-background)"
>
  {#each validComps as component, index}
    {#if component.type === ComponentType.ActionRow}
      {@render ActionRow(component)}
    {:else if component.type === ComponentType.TextDisplay}
      {@render TextDisplay(component, index)}
    {:else if component.type === ComponentType.Container}
      {@render Container(component, index)}
    {:else if component.type === ComponentType.Section}
      {@render Section(component, index)}
    {:else if component.type === ComponentType.Separator}
      {@render Separator(component)}
    {:else if component.type === ComponentType.MediaGallery}
      {@render MediaGallery(component, index)}
    {/if}
  {/each}
</div>

{#if hasMediaGallery}
  <Card.Root class="bg-primary/10 border-primary/40 mt-2 border p-2">
    <Card.Header class="px-1">
      <Card.Title class="text-primary">Media Gallery Notice</Card.Title>
      <Card.Description>
        The Media Gallery layout is <b>not</b> correct in this preview because only Discord Gods know how it
        actually works.<br />
        Please test in a real message to see the correct layout.
      </Card.Description>
    </Card.Header>
  </Card.Root>
{/if}
