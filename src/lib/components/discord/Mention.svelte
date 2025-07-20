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

  type BaseProps<T> = {
    class?: ClassValue;
    /**
     * The function to call when the delete action is triggered.
     *
     * This function should return a boolean or a Promise that resolves to a boolean,
     * indicating whether the deletion was successful or not.
     */
    onDelete?: (id: string) => boolean | Promise<boolean>;
  } & T;
  type Props =
    | BaseProps<{
        role: GuildRole;
        channel?: never;
        user?: never;
      }>
    | BaseProps<{
        channel: GuildCoreChannel;
        role?: never;
        user?: never;
      }>
    | BaseProps<{
        user: (Omit<APIUser, "id" | "username"> & Required<Pick<APIUser, "id" | "username">>) | null;
        role?: never;
        channel?: never;
      }>;

  let {
    role,
    channel,
    user,
    class: className,
    onDelete = () => !!toast.error("This function is not set, please report this bug."),
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
  {#if role}
    <Role {role} class={className} />
  {:else if channel}
    <Channel {channel} class={className} />
  {:else if user}
    <User {user} class={className} />
  {/if}

  <MentionActions bind:hovered {id} {onDelete} />
</div>
