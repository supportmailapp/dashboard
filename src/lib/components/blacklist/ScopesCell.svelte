<script lang="ts">
  import { SvelteBitfield } from "$lib/utils/reactiveBitfield.svelte";
  import MessageSquare from "@lucide/svelte/icons/message-square";
  import ShieldUser from "@lucide/svelte/icons/shield-user";
  import Ticket from "@lucide/svelte/icons/ticket";
  import { BlacklistScope } from "supportmail-types";

  let { scopes }: { scopes: bigint } = $props();
  let scopeField = new SvelteBitfield(scopes);
</script>

<div class="flex flex-row items-center gap-1 rounded px-1 py-2">
  {#if scopeField.has(BlacklistScope.tickets)}
    <Ticket class="text-blue-500" />
  {/if}
  {#if scopeField.has(BlacklistScope.reports)}
    <ShieldUser class="text-orange-400" />
  {/if}
  {#if scopeField.has(BlacklistScope.tags)}
    <MessageSquare class="text-green-500" />
  {/if}
</div>
