<script lang="ts">
  import * as Popover from "$ui/popover/index.js";
  import Mention from "$lib/components/discord/Mention.svelte";
  import { buttonVariants } from "$ui/button";
  import { ChannelType } from "discord-api-types/v10";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import ChannelSelect from "$lib/components/discord/ChannelSelect.svelte";
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
>
</ConfigCard>
