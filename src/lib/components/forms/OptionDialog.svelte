<script lang="ts">
  import type { IStringSelectOption } from "$lib/sm-types";
  import { SnowflakeUtil } from "$lib/utils";
  import { Button } from "$ui/button/index.js";
  import Checkbox from "$ui/checkbox/checkbox.svelte";
  import * as Dialog from "$ui/dialog/index.js";
  import { Input } from "$ui/input/index.js";
  import { Label } from "$ui/label/index.js";

  interface Props {
    option: IStringSelectOption | null;
    open: boolean;
    saveBtnLabel?: string;
    onSave?: (_opt: IStringSelectOption) => void;
  }

  let { option = $bindable(null), open = $bindable(false), saveBtnLabel = "Save", onSave }: Props = $props();

  function ensureId(opt: IStringSelectOption) {
    if (!opt.id) opt.id = SnowflakeUtil.generate().toString();
    return opt;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-md gap-6" interactOutsideBehavior="ignore" escapeKeydownBehavior="ignore">
    <Dialog.Header>
      <Dialog.Title>Edit Option</Dialog.Title>
    </Dialog.Header>

    {#if option}
      <form
        class="flex flex-col gap-6"
        onsubmit={(e) => {
          e.preventDefault();
          const opt = ensureId(option as IStringSelectOption);
          // Basic validation
          if (!opt.label || opt.label.trim().length === 0) {
            alert("Label is required");
            return;
          }
          if (!opt.value || opt.value.trim().length === 0) {
            alert("Value is required");
            return;
          }
          onSave?.(opt);
        }}
      >
        <div class="flex w-full max-w-sm flex-col gap-1.5">
          <Label>Label</Label>
          <p class="text-muted-foreground text-sm">The text that will be displayed for this option.</p>
          <Input type="text" bind:value={option.label} minlength={1} maxlength={45} required />
        </div>

        <div class="flex w-full max-w-sm flex-col gap-1.5">
          <Label>Value</Label>
          <p class="text-muted-foreground text-sm">
            The internal value for this option which is used after submitting the form.
          </p>
          <Input type="text" bind:value={option.value} minlength={1} maxlength={100} required />
        </div>

        <div class="flex w-full max-w-sm flex-col gap-1.5">
          <Label>Description</Label>
          <p class="text-muted-foreground text-sm">An optional description for this option.</p>
          <Input type="text" bind:value={option.description} maxlength={100} />
        </div>

        <div class="flex w-full max-w-sm flex-col gap-1.5">
          <Label>Emoji (markdown)</Label>
          <Input type="text" bind:value={option.emoji} maxlength={100} placeholder=":smile:" />
          <p class="text-muted-foreground text-sm">
            Pass emojis as markdown (e.g. <code>:smile:</code> or unicode).
          </p>
        </div>

        <div class="flex w-full max-w-sm flex-col gap-1.5">
          <Label>
            <Checkbox bind:checked={() => option.default ?? false, (v) => ((option as any).default = v)} />
            Default
          </Label>
          <p class="text-muted-foreground text-sm">If enabled, this option will be selected by default.</p>
        </div>

        <Dialog.Footer>
          <Button type="submit">{saveBtnLabel}</Button>
        </Dialog.Footer>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>
