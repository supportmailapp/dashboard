<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import type { IAnonym } from "$lib/sm-types";
  import { Label } from "$ui/label";
  import { Switch } from "$ui/switch";

  let { anonymSettings = $bindable() }: { anonymSettings: IAnonym | undefined } = $props();
</script>

<ConfigCard rootClass="col-span-full lg:col-span-3" title="Anonym Settings" class="space-y-2">
  {#if !anonymSettings}
    <LoadingSpinner />
  {:else}
    <Label
      class="hover:bg-accent/50 has-aria-checked=true:border-accent has-aria-checked=true:bg-accent/50 flex items-start gap-3 rounded-lg border p-3"
    >
      <Switch id="toggle-2" bind:checked={anonymSettings.enabled} variant="success" />
      <div class="grid gap-1.5 font-normal">
        <p class="text-sm leading-none font-medium">Anonym Replies</p>
        <p class="text-muted-foreground text-sm">
          When enabled, every reply from the staff will be anonymously sent to the user, hiding the staff's
          identity.
        </p>
        <p class="text-muted-foreground text-sm">
          This helps keep things focused on the support, not the person.
        </p>
      </div>
    </Label>
    <Label
      class="hover:bg-accent/50 has-aria-checked=true:border-accent has-aria-checked=true:bg-accent/50 flex items-start gap-3 rounded-lg border p-3"
    >
      <Switch id="toggle-2" bind:checked={anonymSettings.user} variant="success" />
      <div class="grid gap-1.5 font-normal">
        <p class="text-sm leading-none font-medium">Anonymous Tickets</p>
        <p class="text-muted-foreground text-sm">
          You can allow users to open tickets without revealing their identity.
        </p>
        <p class="text-muted-foreground text-sm">
          In these cases, the bot assigns them a friendly, random name like "Blue Fox" or "Orange Capybara" so
          their ticket feels natural and not awkward.
        </p>
      </div>
    </Label>
  {/if}
</ConfigCard>
