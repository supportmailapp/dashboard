<script lang="ts">
  import type { ClientSMSelect } from "$lib/sm-types/src";
  import RemoveButtonWrapper from "./RemoveButtonWrapper.svelte";
  import { getTagsManager } from "./tags.svelte";
  import * as Dialog from "$ui/dialog/index";
  import * as Field from "$ui/field/index";
  import * as Select from "$ui/select/index";
  import * as Popover from "$ui/popover/index";
  import { buttonVariants } from "$ui/button";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { validateEmoji } from "$lib/utils/formatting";
  import { SvelteMap } from "svelte/reactivity";
  import Button from "$ui/button/button.svelte";
  import Plus from "@lucide/svelte/icons/plus";
  import Pencil from "@lucide/svelte/icons/pencil";
  import { toast } from "svelte-sonner";
  import Input from "$ui/input/input.svelte";
  import { cn, SnowflakeUtil } from "$lib/utils";
  import Trash from "@lucide/svelte/icons/trash";
  import Combobox from "$ui/combobox/Combobox.svelte";
  import { filterByName } from "./Button.svelte";
  import Separator from "$ui/separator/separator.svelte";
  import { untrack } from "svelte";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import { slide } from "svelte/transition";
  import Emoji from "./Emoji.svelte";
  import { getCategoriesManager } from "./categories.svelte";

  type Props = ComponentWithRemoveHandler<Omit<ClientSMSelect, "type" | "custom_id">>;

  let { placeholder = $bindable(), options = $bindable([]), onRemove }: Props = $props();

  const tagsManager = getTagsManager();
  const catsManager = getCategoriesManager();
  type OptionError = "emoji" | "emptyLabel" | "noTag" | "noCategory";
  const optionErrorLabels = {
    emoji: "Invalid emoji format.",
    emptyLabel: "Label cannot be empty.",
    noTag: "No tag selected for reply action.",
    noCategory: "No category selected for ticket creation action.",
  };
  /**
   * Whether the emoji for a select option is valid.
   */
  const optionEvals = new SvelteMap<number, OptionError[]>();
  const emojiBuffers = new SvelteMap<string, string>();
  let openOption = $state<number>(-1);

  const OptionLabels = {
    reply: "Reply with a Tag",
    "ticket:create": "Start Ticket",
  };

  function addOption() {
    if (options.length >= 25) {
      toast.error("You can only have up to 25 options in a select menu.");
      return;
    }

    options = [
      ...options,
      {
        local: true,
        _id: SnowflakeUtil.generate().toString(),
        action: "reply",
        label: "New Option",
        value: "",
        description: "",
        emoji: "",
      },
    ];
  }

  function filterTags(tagId: string, search: string, commandKeywords?: string[]): number {
    return filterByName(tagsManager.tags, tagId, search, commandKeywords);
  }

  function filterTicketCategories(categoryId: string, search: string, commandKeywords?: string[]): number {
    return filterByName(catsManager.cats, categoryId, search, commandKeywords);
  }

  $effect(() => {
    untrack(() => console.log("Evaluating options"));
    if (options.length === 0) {
      optionEvals.clear();
      return;
    }
    options.forEach((opt, index) => {
      const errors: OptionError[] = [];
      if (!opt.label || opt.label.trim().length === 0) {
        errors.push("emptyLabel");
      }
      if (opt.emoji) {
        const validated = validateEmoji(opt.emoji);
        if (!validated) {
          errors.push("emoji");
        }
      }
      if (opt.action === "reply" && (!opt.value || opt.value.trim().length === 0)) {
        errors.push("noTag");
      }
      if (opt.action === "ticket:create" && (!opt.value || opt.value.trim().length === 0)) {
        errors.push("noCategory");
      }
      if (errors.length > 0) {
        optionEvals.set(index, errors);
      } else {
        optionEvals.delete(index);
      }
    });
  });

  $effect(() => {
    if (openOption !== -1 && !tagsManager.loaded) {
      untrack(() => tagsManager.fetchTags());
    }
  });

  $effect(() => {
    if (openOption !== -1 && !catsManager.loaded) {
      untrack(() => catsManager.fetchCats());
    }
  });
</script>

<RemoveButtonWrapper {onRemove} class="flex-0">
  <div class="discord-select mr-3">
    <input
      type="text"
      aria-label="Panel Select Placeholder"
      class="field-sizing-content flex-1 truncate font-medium"
      maxlength="100"
      bind:value={() => placeholder || "", (v) => (placeholder = v)}
    />

    <Dialog.Root
      onOpenChange={(_open) => {
        if (_open && !tagsManager.loaded) {
          tagsManager.fetchTags();
        }
      }}
    >
      <Dialog.Trigger
        class={buttonVariants({
          variant: "ghost",
          size: "icon-sm",
          class: "p-1 data-[state=open]:scale-y-[-1]",
        })}
      >
        <ChevronDown class="size-5" />
      </Dialog.Trigger>
      <Dialog.Content class="max-h-[80vh] w-full max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-xl">
        <Dialog.Header>
          <Dialog.Title>Select Menu Options</Dialog.Title>
          <Dialog.Description>Add up to 25 custom options</Dialog.Description>
        </Dialog.Header>

        <div class="flex max-h-100 flex-col overflow-clip overflow-y-auto rounded-md bg-[#2f3136]">
          {#each options as opt, index (opt._id)}
            {@const emoji = opt.emoji}
            {@const handleEmojiBlur = () => (options[index].emoji = emojiBuffers.get(opt._id)?.trim() || "")}
            <div
              class={cn(
                "flex flex-row items-center gap-2 p-1.5 transition-colors duration-75 ease-in hover:bg-[#36393f]",
                optionEvals.has(index) && "stripes-background",
              )}
              transition:slide={{ duration: 150, axis: "y" }}
            >
              {#if !!emoji && emoji.length > 0}
                <Emoji {emoji} />
              {/if}

              <div class="flex w-fit flex-col justify-center px-2 py-1">
                <p class="text-sm font-semibold text-white">{opt.label}</p>
                {#if opt.description}
                  <p class="text-muted-foreground text-sm">{opt.description}</p>
                {/if}
              </div>

              <Popover.Root bind:open={() => openOption === index, (v) => (openOption = v ? index : -1)}>
                <Popover.Trigger
                  class={buttonVariants({ variant: "secondary", size: "icon-sm", class: "ml-auto" })}
                >
                  <Pencil />
                </Popover.Trigger>
                <Popover.Content class="w-80">
                  <Field.Group class="gap-4">
                    <Field.Field class="gap-1">
                      <Field.Label>Name</Field.Label>
                      <Input type="text" bind:value={options[index].label} maxlength={100} />
                    </Field.Field>

                    <Field.Field class="gap-1">
                      <Field.Label>Description</Field.Label>
                      <Input type="text" bind:value={options[index].description} maxlength={100} />
                    </Field.Field>

                    <Field.Field class="gap-2">
                      <Field.Label>Emoji</Field.Label>
                      <Input
                        type="text"
                        class="w-full text-sm"
                        placeholder="<:emoji_name:emoji_id> or 😀"
                        bind:value={
                          () => emojiBuffers.get(opt._id) ?? "", (v) => emojiBuffers.set(opt._id, v)
                        }
                        onblur={handleEmojiBlur}
                        min="3"
                        max="100"
                      />
                    </Field.Field>

                    <Field.Separator />

                    <Field.Field class="gap-1">
                      <Field.Label>Action</Field.Label>
                      <Select.Root
                        type="single"
                        bind:value={
                          () => options[index].action,
                          (v) => {
                            options[index].action = v;
                            options[index].value = "";
                          }
                        }
                      >
                        <Select.Trigger placeholder="Select Action">
                          {OptionLabels[options[index].action as keyof typeof OptionLabels]}
                        </Select.Trigger>
                        <Select.Content>
                          {#each Object.keys(OptionLabels) as value}
                            <Select.Item {value}>
                              {OptionLabels[value as keyof typeof OptionLabels]}
                            </Select.Item>
                          {/each}
                        </Select.Content>
                      </Select.Root>
                    </Field.Field>

                    {#if options[index].action === "reply"}
                      <Field.Field class="gap-1">
                        <Field.Label>Tag to Reply With</Field.Label>

                        <Combobox
                          popoverTriggerClass="w-full"
                          label={!opt.value
                            ? "Select a tag"
                            : (tagsManager.tags.get(opt.value) ?? "Unknown Tag")}
                          closeOnSelect
                          selected={opt.value ? [opt.value] : []}
                          onSelect={(value) => {
                            console.log("Selected tag:", value);
                            options[index].value = value;
                          }}
                          options={tagsManager.tags
                            .entries()
                            .toArray()
                            .map(([id, name]) => ({ value: id, label: name }))}
                          filter={filterTags}
                        />
                      </Field.Field>
                    {:else if options[index].action === "ticket:create"}
                      <Field.Field orientation="vertical" class="gap-1">
                        <Field.Label>Ticket Category (optional)</Field.Label>
                        <Combobox
                          popoverTriggerClass="w-full"
                          label={!opt.value
                            ? "Select a category"
                            : (catsManager.cats.get(opt.value) ?? "Unknown Category")}
                          closeOnSelect
                          selected={opt.value ? [opt.value] : []}
                          onSelect={(value) => (options[index].value = value)}
                          options={catsManager.cats
                            .entries()
                            .toArray()
                            .map(([id, name]) => ({ value: id, label: name }))}
                          filter={filterTicketCategories}
                        />
                      </Field.Field>
                    {/if}
                  </Field.Group>

                  <Button
                    variant="secondary"
                    onclick={() => {
                      openOption = -1;
                    }}
                    class="mt-3 w-full"
                  >
                    Close
                  </Button>
                </Popover.Content>
              </Popover.Root>
              <Button
                variant="destructive"
                size="icon-sm"
                onclick={() => {
                  options = options.filter((_, i) => i !== index);
                }}
              >
                <Trash />
              </Button>
            </div>
          {/each}
          <div class="flex w-full p-2">
            <Button variant="outline" onclick={addOption} disabled={options.length >= 25} class="w-full">
              <Plus class={options.length >= 25 ? "hidden" : ""} />
              {options.length >= 25 ? "25 Options Reached" : "Option"}
            </Button>
          </div>
        </div>

        {#if optionEvals.size > 0}
          <Separator class="my-2" />

          <Field.Field class="text-destructive max-h-40 overflow-y-auto">
            <Field.Label class="animate-pulse-fast font-bold">Invalid Options!</Field.Label>
            <ul class="list-inside list-disc text-sm">
              {#each Array.from(optionEvals.entries()) as [index, errors]}
                <li>
                  Option {index + 1}:
                  <ul class="ms-4 list-inside">
                    {#each errors as error}
                      <li>
                        <ChevronRight class="inline-block size-4" />
                        {optionErrorLabels[error]}
                      </li>
                    {/each}
                  </ul>
                </li>
              {/each}
            </ul>
          </Field.Field>
        {/if}
      </Dialog.Content>
    </Dialog.Root>
  </div>
</RemoveButtonWrapper>
