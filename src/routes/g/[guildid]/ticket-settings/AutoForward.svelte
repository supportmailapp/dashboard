<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { Label } from "$ui/label";
  import { Switch } from "$ui/switch";

  let { autoForward = $bindable(), saveAllFn }: { autoForward: boolean; saveAllFn: SaveFunction } = $props();

  let oldConfig = $state($state.snapshot(autoForward));
  let loading = $state(false);

  $inspect("oldConfig", oldConfig);
  $inspect("current autoforward", autoForward);
</script>

<ConfigCard
  rootClass="col-span-full lg:col-span-2"
  class="flex flex-col gap-4"
  title="Automatic Forwarding"
  description="This setting indicates whether messages in ticket posts are always forwarded to the user or not."
  saveFn={async () =>
    await saveAllFn(
      (v: boolean) => (loading = v),
      (data: DBGuildProjectionReturns["generalTicketSettings"]) => {
        oldConfig = data.autoForwarding;
      },
    )}
  saveBtnDisabled={loading}
  saveBtnLoading={loading}
>
  <Label>
    <Switch bind:checked={autoForward} />
    Automatic Forwarding
  </Label>
</ConfigCard>
