<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import type { IAnonym } from "$lib/sm-types";
  import { Label } from "$ui/label";
  import Switch from "$ui/switch/switch.svelte";
  import * as Field from "$ui/field/index.js";
  import Separator from "$ui/separator/separator.svelte";

  let { anonymSettings = $bindable() }: { anonymSettings: IAnonym | undefined } = $props();
</script>

<ConfigCard rootClass="col-span-full lg:col-span-3" title="Anonym Settings" class="space-y-2">
  {#if !anonymSettings}
    <LoadingSpinner />
  {:else}
    <Field.Group>
      <Field.Field orientation="horizontal">
        <Field.Content>
          <Field.Label>Anonym Replies</Field.Label>
          <Field.Description>
            When enabled, every reply from the staff will be anonymously sent to the user, hiding the staff's
            identity.
            <br />
            This helps keep things focused on the support, not the person.
          </Field.Description>
        </Field.Content>
        <Switch id="toggle-2" bind:checked={anonymSettings.enabled} variant="success" />
      </Field.Field>

      <Field.Separator />

      <Field.Field orientation="horizontal">
        <Field.Content>
          <Field.Label>Anonymous Tickets</Field.Label>
          <Field.Description>
            You can allow users to open tickets without revealing their identity.
            <br />
            In these cases, the bot assigns them a friendly, random name like "Blue Fox" or "Orange Capybara" so
            their ticket feels natural and not awkward.
          </Field.Description>
        </Field.Content>
        <Switch id="toggle-2" bind:checked={anonymSettings.user} variant="success" />
      </Field.Field>
    </Field.Group>
  {/if}
</ConfigCard>
