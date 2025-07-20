<script lang="ts">
  import type { ClassValue } from "clsx";
  import { cn } from "$lib/utils";
  import AtSign from "@lucide/svelte/icons/at-sign";
  import type { APIUser } from "discord-api-types/v10";

  type Props = {
    user?: Omit<APIUser, "id" | "username"> & Required<Pick<APIUser, "id" | "username">>;
    class?: ClassValue;
  };

  let { user, class: className }: Props = $props();
</script>

<div data-slot="mention-container" class={cn(className)} data-id={user?.id}>
  <AtSign class="size-3.5" />
  <span class="text-sm font-medium">
    {user?.global_name ?? user?.username ?? "unknown-user"}
  </span>
</div>
