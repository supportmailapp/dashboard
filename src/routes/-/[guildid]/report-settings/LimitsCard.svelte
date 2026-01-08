<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import type { ReportLimitsConfig } from "$lib/sm-types";
  import Input from "$ui/input/input.svelte";
  import Label from "$ui/label/label.svelte";
  import { Separator } from "$ui/separator";
  import Info from "@lucide/svelte/icons/info";

  type Props = ReportLimitsConfig & {
    loading: boolean;
  };

  let {
    perUserReceive = $bindable(10),
    perUserCreate = $bindable(5),
    opens = $bindable(20),
    loading = $bindable(),
  }: Props = $props();
</script>

<ConfigCard
  title="Limits"
  description="Set limits for reports"
  rootClass="col-span-full lg:col-span-3"
  class="space-y-2"
>
  <div class="grid grid-cols-[auto_1fr] gap-2 [&>input]:w-22">
    <Input
      type="number"
      value={perUserReceive || 10}
      min={1}
      max={10}
      oninput={(e) => {
        const v = parseInt(e.currentTarget.value);
        perUserReceive = Math.min(Math.max(v, 1), 10);
      }}
    />
    <Label>Max open reports per user</Label>

    <Input
      type="number"
      value={perUserCreate || 5}
      min={1}
      max={50}
      oninput={(e) => {
        const v = parseInt(e.currentTarget.value);
        perUserCreate = Math.min(Math.max(v, 1), 50);
      }}
    />
    <Label>Max open reports a user can create</Label>

    <Input
      type="number"
      value={opens || 20}
      min={1}
      max={100}
      oninput={(e) => {
        const v = parseInt(e.currentTarget.value);
        opens = Math.min(Math.max(v, 1), 100);
      }}
    />
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
