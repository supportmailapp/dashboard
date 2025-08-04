<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { Checkbox } from "$ui/checkbox";
  import { Label } from "$ui/label";
  import { Switch } from "$ui/switch";
  import type { IAnonym } from "supportmail-types";

  let {
    anonymSettings = $bindable(),
    saveAllFn,
  }: { anonymSettings: IAnonym | undefined; saveAllFn: SaveFunction } = $props();
  let saving = $state(false);
</script>

<ConfigCard
  title="Anonym Settings"
  saveFn={async () => await saveAllFn((v: boolean) => (saving = v))}
  class="space-y-2"
>
  {#if !anonymSettings}
    <LoadingSpinner />
  {:else}
    <Label
      class="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
    >
      <Switch
        id="toggle-2"
        bind:checked={anonymSettings.enabled}
        class="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
      />
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
      class="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
    >
      <Switch id="toggle-2" bind:checked={anonymSettings.user} />
      <div class="grid gap-1.5 font-normal">
        <p class="text-sm leading-none font-medium">Anonymoues Tickets</p>
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
