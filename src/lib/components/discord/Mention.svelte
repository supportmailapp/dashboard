<script lang="ts">
  import "./mentions.css";
  import type { ClassValue } from "svelte/elements";
  import Channel from "./Channel.svelte";
  import Role from "./Role.svelte";
  import MentionActions from "./MentionActions.svelte";
  import { toast } from "svelte-sonner";
  import "./mentions.css";
  import User from "./User.svelte";

  // Component wrapper for colors and copy & delete button
  type Props = {
    class?: ClassValue;
    /**
     * The function to call when the delete action is triggered.
     *
     * This function should return a boolean or a Promise that resolves to a boolean,
     * indicating whether the deletion was successful or not.
     */
    onDelete?: (id: string) => any;
    channel?: APIGuildChannel;
    /**
     * Channel ID as a fallback.
     */
    channelId?: string;
    roleId?: string;
    userId?: string;
    /**
     * Which actions to enable.
     *
     * @default "all"
     */
    buttons?: "delete" | "copy" | "all" | "none";
  };

  let {
    roleId,
    userId,
    channel,
    channelId,
    class: className,
    onDelete = () => !!toast.error("This function is not set, please report this bug."),
    buttons = "all",
  }: Props = $props();
  let hovered = $state(false);

  function setHovered(value: boolean) {
    return () => (hovered = value);
  }
</script>

<div
  class="mention-wrapper"
  role="button"
  tabindex="0"
  onmouseover={setHovered(true)}
  onmouseout={setHovered(false)}
  onfocus={setHovered(true)}
  onblur={setHovered(false)}
>
  {#if roleId}
    <Role {roleId} class={className} />
  {:else if userId}
    <User {userId} class={className} />
  {:else if channel || channelId}
    <Channel {channel} class={className} {channelId} />
  {/if}

  {#if (userId || roleId || channel || channelId) && buttons !== "none"}
    <MentionActions bind:hovered id={userId ?? roleId ?? channel?.id ?? channelId} {onDelete} {buttons} />
  {/if}
</div>
