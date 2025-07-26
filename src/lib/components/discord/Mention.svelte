<script lang="ts">
  import "./mentions.css";
  import type { ClassValue } from "clsx";
  import Channel from "./Channel.svelte";
  import Role from "./Role.svelte";
  import User from "./User.svelte";
  import MentionActions from "./MentionActions.svelte";
  import { toast } from "svelte-sonner";

  // Component wrapper for colors and copy & delete button
  type Props = {
    class?: ClassValue;
    /**
     * The function to call when the delete action is triggered.
     *
     * This function should return a boolean or a Promise that resolves to a boolean,
     * indicating whether the deletion was successful or not.
     */
    onDelete?: (id: string) => boolean | Promise<boolean>;
    channel?: GuildCoreChannel;
    userId?: string;
    role?: GuildRole;
    /**
     * The fallback type to use when no specific mention type is provided.
     * - `c` - channel
     * - `r` - role
     *
     * **Important:**
     * Since the mention automatically handles fetching users from the websocket, there is no need for a fallback, because the fallback is automatically applied, as long as the user isn't fetched.
     */
    fallback?: "c" | "r";
    /**
     * Which actions to enable.
     *
     * @default "all"
     */
    buttons?: "delete" | "copy" | "all" | "none";
  };

  let {
    role,
    channel,
    userId,
    class: className,
    onDelete = () => !!toast.error("This function is not set, please report this bug."),
    fallback = role ? "r" : channel ? "c" : undefined,
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
  {#if role || fallback === "r"}
    <Role {role} class={className} />
  {:else if channel || fallback === "c"}
    <Channel {channel} class={className} />
  {:else if userId}
    <User {userId} class={className} />
  {/if}

  {#if role || channel || userId}
    <MentionActions bind:hovered id={role?.id ?? channel?.id ?? userId} {onDelete} {buttons} />
  {/if}
</div>
