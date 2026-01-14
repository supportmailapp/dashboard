<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import ContentEditorDialog from "$lib/components/ContentEditorDialog.svelte";
  import Button from "$ui/button/button.svelte";
  import * as Field from "$ui/field/index.js";
  import Pencil from "@lucide/svelte/icons/pencil";

  let {
    creationMessage = $bindable(),
    closeMessage = $bindable(),
  }: { creationMessage: string; closeMessage: string } = $props();

  let dialogState = $state({
    isOpen: false,
    type: "create" as "create" | "close",
    rawText: "",
  });
</script>

<ConfigCard
  rootClass="col-span-full lg:col-span-3"
  title="Default Messages"
  description="These are used when creating or closing tickets and nothing else is set."
>
  <Field.Group>
    <Field.Field orientation="responsive">
      <Field.Label>Ticket Creation Message</Field.Label>
      <Button
        onclick={() => {
          dialogState = {
            isOpen: true,
            type: "create",
            rawText: creationMessage || "",
          };
        }}
      >
        <Pencil class="size-4" />
        Edit
      </Button>
    </Field.Field>
    <Field.Field orientation="responsive">
      <Field.Label>Ticket Close Message</Field.Label>
      <Button
        onclick={() => {
          dialogState = {
            isOpen: true,
            type: "close",
            rawText: closeMessage || "",
          };
        }}
      >
        <Pencil class="size-4" />
        Edit
      </Button>
    </Field.Field>
  </Field.Group>
  <ContentEditorDialog
    title="Ticket Creation Message"
    bind:open={dialogState.isOpen}
    bind:rawText={dialogState.rawText}
    onRawTextChange={(text) => {
      if (dialogState.type === "create") {
        creationMessage = text;
      } else {
        closeMessage = text;
      }
    }}
  />
</ConfigCard>
