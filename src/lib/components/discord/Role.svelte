<script lang="ts">
  import { cn } from "$lib/utils";
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    roleId: string;
    class?: ClassValue;
  };

  let { roleId, class: className }: Props = $props();

  let guildsManager = getManager();
  let role = $derived(guildsManager.roles.get(roleId));
  const color = $derived(role?.color ? `#${role.color.toString(16).padStart(6, "0")}` : null);
</script>

<div data-slot="mention-container" class={cn("flex items-center gap-1", className)} data-role-id={role?.id}>
  {#if color}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={color}
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-circle-small-icon lucide-circle-small"
    >
      <circle cx="12" cy="12" r="6" />
    </svg>
  {/if}
  <span class="truncate text-sm font-medium">
    {role?.name || "unknown-role"}
  </span>
</div>
