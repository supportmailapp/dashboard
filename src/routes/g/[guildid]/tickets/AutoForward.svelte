<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import { Label } from "$ui/label";
  import { Switch } from "$ui/switch";
  import equal from "fast-deep-equal/es6";
  import { toast } from "svelte-sonner";

  let { autoForward = $bindable() }: { autoForward: boolean } = $props();

  const oldConfig = $state.snapshot(autoForward);

  async function saveFn() {
    const currentSetting = $state.snapshot(autoForward);
    if (equal(oldConfig, currentSetting)) {
      toast.info("Nothing to save.");
      return;
    }
  }
</script>

<ConfigCard
  class="flex flex-col gap-4"
  title="Pausing Status"
  description="Pausing won't reset any settings."
  {saveFn}
  saveBtnDisabled={equal(oldConfig, $state.snapshot(autoForward))}
>
  <Label>
    <Switch bind:checked={autoForward} />
  </Label>
</ConfigCard>
