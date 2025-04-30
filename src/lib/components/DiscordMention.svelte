<script lang="ts">
  import { gg } from "$lib/stores/guild.svelte";
  import { numberToHex } from "$lib/utils/formatting";
  import { CircleHelp, CircleUserRound, Files, Trash } from "@lucide/svelte";

  export type MentionProps = {
    id: string;
    name?: string;
    typ?: "user" | "role";
    roleColor?: number;
    /**
     * Set the maximum length of the mention name.
     *
     * - Calculated in rems. `0.25rem * cutLengthAt = X px`
     *
     * @example
     * cutLengthAt="40" // 10rem = 160px
     * cutLengthAt=20 // 5rem = 80px
     *
     * @default 40
     */
    cutLengthAt?: number | string;
    /**
     * If true, a delete button will be rendered on hover on the side of the mention.
     *
     * If clicked, the `deleted` prop will be set to true.
     *
     * This is useful, for example, when you want to delete this user/role from a list.
     */
    withDelete?: boolean;
    /**
     * If true, the user clicked the mention to be deleted. Decide what you want to do with it - it's bindable.
     */
    deleteFn?: () => void;
  };

  let {
    id,
    name = id,
    typ = "user",
    roleColor = 0,
    cutLengthAt = 20,
    deleteFn = () => console.warn("No function set!"),
    withDelete = true,
  }: MentionProps = $props();
  let loadingUser = $state(false);
  let showActions = $state(false);

  $effect(() => {
    if (typ === "role") {
      name = gg.roles?.find((r) => r.id === id)?.name || id;
      if (name === id) console.warn(`Role with ID ${id} not found in guild roles. Maybe it was deleted...`);
    }
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_mouse_events_have_key_events -->
<div
  data-id={id}
  class="discord-mention text-base-content relative overflow-clip font-light {'max-w-' + cutLengthAt.toString()}"
  onmouseover={() => (showActions = true)}
  onmouseleave={() => (showActions = false)}
>
  <!-- Add click state -->
  {#if withDelete}
    <button
      class="discord-mention-action left-0"
      style={showActions ? "top: 0" : "top: -100px"}
      onclick={(e) => {
        e.stopPropagation();
        deleteFn();
      }}
    >
      <Trash class="text-error" size="1.25rem" />
    </button>
  {/if}
  <button
    class="discord-mention-action right-0 {withDelete ? 'w-1/2' : 'w-full'}"
    style={showActions ? "top: 0" : "top: -100px"}
    onclick={(e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(id);
      alert(`Copied ${typ[0].toUpperCase() + typ.slice(1)} ID.`);
    }}
  >
    <Files class="text-info" size="1.25rem" />
  </button>
  {#if typ === "role"}
    <div
      class="{withDelete ? 'size-4' : 'size-3'} dy-btn-circle grid place-items-center"
      style="background-color: {'#' + numberToHex(roleColor)};"
    ></div>
  {:else if typ === "user"}
    <CircleUserRound />
  {:else}
    <!-- This should never happen... -->
    <CircleHelp />
  {/if}
  {#if !loadingUser}
    <span class={name != id ? `w-full truncate` : ""}>{String(name)}</span>
  {:else}
    <span class="dy-loading dy-loading-dots"></span>
  {/if}
</div>
