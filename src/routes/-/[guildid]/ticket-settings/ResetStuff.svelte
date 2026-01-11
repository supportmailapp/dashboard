<script lang="ts">
  import * as Card from "$ui/card/index.js";
  import * as Field from "$ui/field/index.js";
  import * as Dialog from "$ui/dialog/index.js";
  import Combobox from "$ui/combobox/Combobox.svelte";
  import { buttonVariants } from "$ui/button";
  import Button from "$ui/button/button.svelte";
  import Checkbox from "$ui/checkbox/checkbox.svelte";
  import Input from "$ui/input/input.svelte";
  import { slide } from "svelte/transition";

  const Options = [
    { label: "Ticket Categories", value: "categories" },
    { label: "Ticket Forum", value: "forum" },
    { label: "Anonym Settings", value: "anonym" },
    { label: "Other (Anonym, Auto Forwarding, Bots, Pings)", value: "other" },
  ];

  let selectedOptions = $state<string[]>([]);
  let open = $state(false);
  let resetAllowed = $state(false);
</script>

<Card.Root destructive class="col-span-full">
  <Card.Header>
    <Card.Title>Danger Zone</Card.Title>
  </Card.Header>
  <Card.Content>
    <!-- User can reset ticket settings here (field by field) -->
    <Dialog.Root
      bind:open
      onOpenChangeComplete={(v) => {
        if (!v) {
          selectedOptions = [];
          resetAllowed = false;
        }
      }}
    >
      <Dialog.Trigger class={buttonVariants({ variant: "destructive", size: "lg" })}>
        Reset Ticket Settings
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Reset Ticket Settings</Dialog.Title>
          <Dialog.Description>
            Select which parts of the ticket system you want to reset to default values.<br />
            This action cannot be undone.
          </Dialog.Description>
        </Dialog.Header>
        <Field.Group>
          <Field.Field>
            <Combobox
              options={Options}
              bind:selected={
                () => selectedOptions,
                (vals) => {
                  // enforce order like in Options array
                  selectedOptions = Options.filter((opt) => vals.includes(opt.value)).map((opt) => opt.value);
                }
              }
            />
          </Field.Field>

          <Field.Separator />

          <Field.Field>
            <Field.Label>The following options will be reset:</Field.Label>
            <ul class="list-disc pl-5">
              {#each selectedOptions as option}
                <li transition:slide={{ axis: "y", duration: 150 }}>
                  {Options.find((opt) => opt.value === option)?.label || option}
                </li>
              {/each}
              {#if selectedOptions.length === 0}
                <li transition:slide={{ axis: "y", duration: 150 }}>No options selected.</li>
              {/if}
            </ul>
          </Field.Field>

          <Field.Separator />

          <Field.Field orientation="vertical" aria-disabled={!selectedOptions.length}>
            <Field.Label>Type DELETE below to confirm</Field.Label>
            <Input
              placeholder="DELETE"
              disabled={!selectedOptions.length}
              class="transition-all"
              oninput={(e) => {
                e.currentTarget.value = e.currentTarget.value.toUpperCase();
                resetAllowed = e.currentTarget.value === "DELETE";
              }}
            />
          </Field.Field>
        </Field.Group>
        <Dialog.Footer>
          <Dialog.Close class={buttonVariants({ variant: "destructive" })}>Close</Dialog.Close>
          <Button variant="secondary" disabled={!resetAllowed || selectedOptions.length === 0}>Reset</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  </Card.Content>
</Card.Root>
