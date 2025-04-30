<script lang="ts">
  import { APIRoutes, BASIC_GET_FETCH_INIT } from "$lib/constants";
  import { gg } from "$lib/stores/guild.svelte";
  import { numberToHex } from "$lib/utils/formatting";
  import { Circle, CircleHelp, CircleUserRound, XIcon } from "@lucide/svelte";
  import ky from "ky";

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
     * If true, a delete button will be shown on the right side of the mention.
     *
     * If clicked, the `deleted` prop will be set to true.
     *
     * This is useful, for example, when you want to delete this user/role from a list.
     */
    withDelete?: boolean;
    /**
     * If true, the user clicked the mention to be deleted. Decide what you want to do with it - it's bindable.
     */
    deleted?: boolean;
  };

  let {
    id,
    name = id,
    typ = "user",
    roleColor = 0,
    cutLengthAt = 40,
    deleted = $bindable(false),
    withDelete = false,
  }: MentionProps = $props();
  let loadingUser = $state(false);

  async function fetchUser(uid: string) {
    if (!gg.guild || id == name) return;
    loadingUser = true;
    const res = await ky.get(APIRoutes.guildMember(gg.guild.id, uid), {
      ...BASIC_GET_FETCH_INIT,
    });

    if (res.ok) {
      const data = await res.json<PartialGuildMember>();
      if (data) name = data.username || "undefined";
    }
    loadingUser = false;
  }

  $effect(() => {
    if (typ === "role") {
      name = gg.roles?.find((r) => r.id === id)?.name || id;
      if (name === id) console.warn(`Role with ID ${id} not found in guild roles. Maybe it was deleted...`);
    }
  });
</script>

<div
  class="discord-mention text-base-content font-light"
  onclickcapture={function clickFunction(_: any) {
    navigator.clipboard.writeText(id);
    alert(`Copied ${typ[0].toUpperCase() + typ.slice(1)} ID to clipboard!`);
    if (name === id) fetchUser(id);
  }}
>
  {#if typ === "role"}
    <Circle color={numberToHex(roleColor)} fill={numberToHex(roleColor)} class="size-3" />
  {:else if typ === "user"}
    <CircleUserRound />
  {:else}
    <!-- This should never happen... -->
    <CircleHelp />
  {/if}
  {#if !loadingUser}
    <span class={name != id ? `w-fit ${"max-w-" + cutLengthAt.toString()} truncate` : ""}>{String(name)}</span>
  {:else}
    <span class="dy-loading dy-loading-dots"></span>
  {/if}
  {#if withDelete}
    <button
      class="text-error ml-2"
      onclick={() => {
        deleted = true;
      }}
    >
      <XIcon class="size-4" />
    </button>
  {/if}
</div>
