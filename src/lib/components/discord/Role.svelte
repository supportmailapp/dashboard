<script lang="ts">
  import type { ClassValue } from "clsx";
  import { cn } from "$lib/utils";
  import type { APIRole } from "discord-api-types/v10";

  type Props = {
    role?: GuildRole;
    class?: ClassValue;
  };

  let { role, class: className }: Props = $props();
  const color = $derived(
    role?.colors?.primary_color ? `#${role?.color.toString(16).padStart(6, "0")}` : null,
  );
</script>

<div data-slot="mention-container" class={cn(className)} data-id={role?.id}>
  {#if color}
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={color}
        stroke="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-circle-small-icon lucide-circle-small size-5.5"
      >
        <circle cx="12" cy="12" r="6" />
      </svg>
    </div>
  {/if}
  <span class="text-sm font-medium">
    {role?.name || "unknown-role"}
  </span>
</div>
