<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import { cn } from "$lib/utils";

  type Props = {
    channelId?: string | null;
    loading: boolean;
  };

  let { channelId = $bindable(), loading = $bindable() }: Props = $props();

  let modalOpen = $state(false);
</script>

<ConfigCard
  title="Alert Channel"
  description="Select the channel where new reports get sent to."
  rootClass="col-span-full lg:col-span-3"
  class={cn("flex flex-col items-start gap-2", loading && "pointer-events-none opacity-50")}
></ConfigCard>
