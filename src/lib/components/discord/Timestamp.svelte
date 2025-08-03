<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { relativeDatetime } from "$lib/utils";
  import dayjs from "dayjs";

  export type TimestampFormat = "t" | "T" | "d" | "D" | "f" | "F" | "R";

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
     * - `R`: Relative time (e.g., "2 hours ago", "in 3 days")
     *
     * @default "f"
     */
    format?: TimestampFormat;
  }

  let { date: nonReactiveDate, format = "f" }: Props = $props();

  let parsedDate = $state(dayjs(nonReactiveDate));

  const formatTimestamp = () => {
    const d = parsedDate;

    const formatMap = {
      t: d.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      T: d.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      d: d.toDate().toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" }),
      D: d.toDate().toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" }),
      f: `${d.toDate().toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })} at ${d.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      F: `${d.toDate().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at ${d.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      R: relativeDatetime(d),
    };

    return formatMap[format];
  };

  let formattedDate = $state<string>(formatTimestamp());
  $inspect("formattedDate", formattedDate);

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

<Tooltip.Provider delayDuration={0} disableCloseOnTriggerClick>
  <Tooltip.Root>
    <Tooltip.Trigger class="bg-card-foreground/20 rounded-[calc(var(--radius)-2px)] px-1 py-0.5">
      {formattedDate}
    </Tooltip.Trigger>
    <Tooltip.Content class="select-none">
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
</Tooltip.Provider>
