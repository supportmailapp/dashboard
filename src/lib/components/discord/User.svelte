<script lang="ts">
  import type { ClassValue } from "clsx";
  import { cn } from "$lib/utils";
  import AtSign from "@lucide/svelte/icons/at-sign";
  import { fetchMentionUsers, mentionUsers } from "$lib/stores/users.svelte";
  import { Inset } from "$ui/sidebar";

  type Props = {
    userId: string;
    class?: ClassValue;
  };

  let { userId, class: className }: Props = $props();

  let userMention = $derived(mentionUsers.get(userId));
  let triggeredUserFetch = false;

  $inspect("m user", userMention);

  $effect(() => {
    console.log("Running user effect again");
    if (!triggeredUserFetch && !userMention) {
      triggeredUserFetch = true;
      fetchMentionUsers([userId]);
    }
  });
</script>

<div data-slot="mention-container" class={cn(className)} data-user-id={userId}>
  <AtSign class="size-3.5" />
  <span class="text-sm font-medium">
    {userMention?.global_name ?? userMention?.username ?? "unknown-user"}
  </span>
</div>
