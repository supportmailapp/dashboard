<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import type { IFeedbackConfig } from "supportmail-types";

  type Props = {
    feedback: IFeedbackConfig;
    saveFn: SaveFunction;
  };
  let { feedback = $bindable(), saveFn }: Props = $props();
</script>

<div class="container max-w-4xl space-y-6">
  <div class="grid gap-6 lg:grid-cols-2">
    <ConfigCard title=""></ConfigCard>
  </div>
</div>
