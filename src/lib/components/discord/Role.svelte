<script lang="ts">
  import type { ClassValue } from "clsx";
  import { cn } from "$lib/utils";
  import { page } from "$app/state";

  type Props = {
    roleId: string;
    class?: ClassValue;
  };

  let { roleId, class: className }: Props = $props();
  let role = $derived(page.data.guildsManager.roles?.find((r) => r.id === roleId));
  const color = $derived(role?.color ? `#${role.color.toString(16).padStart(6, "0")}` : null);
</script>

<div data-slot="mention-container" class={cn(className)} data-role-id={role?.id}>
  <div>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={color || "none"}
      stroke={color ? "none" : "black"}
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-circle-small-icon lucide-circle-small size-5.5"
    >
      <circle cx="12" cy="12" r="6" />
    </svg>
  </div>
  <span class="text-sm font-medium">
    {role?.name || "unknown-role"}
  </span>
</div>
