<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { relativeDatetime } from "$lib/utils.js";
  import * as Tooltip from "$ui/tooltip/index.js";
  import dayjs from "dayjs";
  import type { ClassValue } from "svelte/elements";

  export type TimestampFormat = "t" | "T" | "d" | "D" | "f" | "F" | "s" | "S" | "R";

  interface Props {
    date: Date | string;
    /**
     * Format of the timestamp.
     * - `t`: Short time (e.g., "12:34")
     * - `T`: Long time (e.g., "12:34:56")
     * - `d`: Short date (e.g., "01/01/2023")
     * - `D`: Long date (e.g., "January 1, 2023")
     * - `f`: Full date and time (e.g., "January 1, 2023 at 12:34")
     * - `F`: Full date and time with weekday (e.g., "Monday, January 1, 2023 at 12:34")
     * - `s`: Short date and short time (e.g., "01/01/2023, 12:34")
     * - `S`: Short date and long time (e.g., "01/01/2023, 12:34:56")
     * - `R`: Relative time (e.g., "2 hours ago", "in 3 days")
     *
     * @default "f"
     */
    format?: TimestampFormat;
    class?: ClassValue;
  }

  let { date: nonReactiveDate, format = "f", class: classValue }: Props = $props();

  let parsedDate = $derived(dayjs(nonReactiveDate));

  const formatTimestamp = () => {
    const d = dayjs($state.snapshot(parsedDate.toISOString())); // fuckery

    const formatMap = {
      t: d.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      T: d.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      d: d.toDate().toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" }),
      D: d.toDate().toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" }),
      f: `${d.toDate().toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })} at ${d.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      F: `${d.toDate().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at ${d.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      s: `${d.toDate().toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" })}, ${d.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      S: `${d.toDate().toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" })}, ${d.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
      R: relativeDatetime(d),
    };

    return formatMap[format];
  };

  let formattedDate = $state<string>(formatTimestamp());

  $effect(() => {
    console.log("Updating formatted date");
    const id = setInterval(() => {
      formattedDate = formatTimestamp();
    }, 1000);

    return () => {
      clearInterval(id);
    };
  });
</script>

{#if format !== "F"}
  <Tooltip.Root delayDuration={0} disableCloseOnTriggerClick>
    <Tooltip.Trigger class={cn("bg-card-foreground/20 cursor-help rounded-sm px-1.5 py-0.5", classValue)}>
      {formattedDate}
    </Tooltip.Trigger>
    <Tooltip.Content
      class="bg-slate-700 select-none dark:bg-slate-400"
      arrowClasses="dark:bg-slate-400 bg-slate-700"
    >
      <p>
        {parsedDate.toDate().toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          hourCycle: "h24",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </p>
    </Tooltip.Content>
  </Tooltip.Root>
{:else}
  <p class="bg-card-foreground/20 w-fit rounded-sm px-1.5 py-0.5">
    {formattedDate}
  </p>
{/if}
