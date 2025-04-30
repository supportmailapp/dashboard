<script lang="ts">
  import { APIRoutes, BASIC_GET_FETCH_INIT } from "$lib/constants";
  import { gg } from "$lib/stores/guild.svelte";
  import { numberToHex } from "$lib/utils/formatting";
  import { Circle, CircleHelp, CircleUserRound } from "@lucide/svelte";
  import ky from "ky";

  export type MentionProps = {
    id: string;
    name?: string;
    typ?: "user" | "role";
    roleColor?: number;
    /**
     * If true, the channel name will be cut off at 10rem (160px) and will show an ellipsis.
     */
    cutLengthAt?: string;
  };

  let { id, name = id, typ = "user", roleColor = 0, cutLengthAt = "40" }: MentionProps = $props();
  const typeClasses = {
    user: () => "",
    role: (color: number) => {
      const hexxxx = numberToHex(color);
      return `bg-[#${hexxxx}]/40 hover:bg-[#${hexxxx}]/70 text-[#${hexxxx}]`;
    },
  };

  async function fetchUser(uid: string) {
    if (!gg.guild || id == name) return;
    const res = await ky.get(APIRoutes.guildMember(gg.guild.id, uid), {
      ...BASIC_GET_FETCH_INIT,
    });

    if (res.ok) {
      const data = await res.json<PartialGuildMember>();
      if (data) name = data.username || "undefined";
    }
  }

  $effect(() => {
    if (typ === "role") {
      name = gg.roles?.find((r) => r.id === id)?.name || id;
      if (name === id) console.warn(`Role with ID ${id} not found in guild roles. Maybe it was deleted...`);
    }
  });
</script>

<div
  class="discord-mention font-light {typeClasses[typ](roleColor!)}"
  onclickcapture={function clickFunction(_: any) {
    navigator.clipboard.writeText(id);
    alert(`Copied ${typ[0].toUpperCase() + typ.slice(1)} ID to clipboard!`);
  }}
>
  {#if typ === "role"}
    <Circle color={numberToHex(roleColor)} fill={numberToHex(roleColor)} />
  {:else if typ === "user"}
    <CircleUserRound />
  {:else}
    <!-- This should never happen... -->
    <CircleHelp />
  {/if}
  <span class={name != id ? `w-fit ${"max-w-" + cutLengthAt} truncate` : ""}>{String(name)}</span>
</div>
