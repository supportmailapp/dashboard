<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import Input from "$ui/input/input.svelte";
  import Label from "$ui/label/label.svelte";
  import { Separator } from "$ui/separator";
  import Info from "@lucide/svelte/icons/info";
  import type { ReportLimitsConfig } from "supportmail-types";

  type Props = {
    limits: ReportLimitsConfig;
    loading: boolean;
    saveFn: SaveFunction;
  };

  let {
    limits = $bindable({
      perUserReceive: 1,
      perUserCreate: 5,
      opens: 20,
    }),
    loading = $bindable(),
    saveFn,
  }: Props = $props();
</script>

<ConfigCard
  title="Limits"
  description="Set limits for reports"
  rootClass="col-span-full lg:col-span-3"
  class="space-y-2"
  saveFn={async () => {
    await saveFn((v) => (loading = v));
  }}
>
  <div class="grid grid-cols-[auto_1fr] gap-2 [&>input]:w-22">
    <Input type="number" bind:value={limits.perUserReceive} min={1} max={10} />
    <Label>Max open reports per user</Label>

    <Input type="number" bind:value={limits.perUserCreate} min={1} max={50} />
    <Label>Max open reports a user can create</Label>

    <Input type="number" bind:value={limits.opens} min={1} max={100} />
    <Label>Max open reports in the server</Label>
  </div>
  <Separator />
  <div class="text-primary grid grid-cols-[auto_1fr] items-center gap-1.5">
    <!-- translate-y is because it looks nicer if 2+ lines are there -->
    <Info class="size-5 -translate-y-0.5 sm:translate-0" />
    <p class="text-sm">
      There are hardcoded limits which cannot be changed. This might change when
      <span class="text-amber-500">Gold</span> is released.
    </p>
  </div>
</ConfigCard>
