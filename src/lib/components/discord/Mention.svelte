<script lang="ts">
  import "./mentions.css";
  import type { ClassValue } from "clsx";
  import type { APIUser } from "discord-api-types/v10";
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
    user?: (Omit<APIUser, "id" | "username"> & Required<Pick<APIUser, "id" | "username">>) | null;
    role?: GuildRole;
    /**
     * The fallback type to use when no specific mention type is provided.
     * - `u` - user
     * - `c` - channel
     * - `r` - role
     */
    fallback?: "u" | "c" | "r";
  };

  let {
    role,
    channel,
    user,
    class: className,
    onDelete = () => !!toast.error("This function is not set, please report this bug."),
    fallback = role ? "r" : channel ? "c" : "u",
  }: Props = $props();
  const id = $derived<string | undefined>(role?.id ?? channel?.id ?? user?.id);
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
  {:else if user || fallback === "u"}
    <User user={user ?? undefined} class={className} />
  {/if}

  {#if role || channel || user}
    <MentionActions bind:hovered {id} {onDelete} />
  {/if}
</div>
