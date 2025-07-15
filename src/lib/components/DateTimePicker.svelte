<script lang="ts">
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import { CalendarDate, DateFormatter, getLocalTimeZone, today } from "@internationalized/date";
  import { cn } from "$lib/utils.js";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import { Calendar } from "$lib/components/ui/calendar/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { pausePresets } from "$lib/constants";
  import TimePicker from "./TimePicker.svelte";
  import dayjs from "dayjs";

  const djs = dayjs();
  const df = new DateFormatter(navigator.language, {
    dateStyle: "long",
  });

  let value = $state<CalendarDate>(today(getLocalTimeZone()));
  /**
   * Time-string in the format of `hh:mm`.
   */
  let time = $state<string>(djs.hour() + ":" + djs.minute());
  const valueString = $derived(value ? df.format(value.toDate(getLocalTimeZone())) : "");

  type Props = {
    /**
     *
     * @param selectedDate ISO 8601 timestamp
     */
    onChange: (selectedDate: string) => void;
  };

  let { onChange }: Props = $props();

  function changeFn(val: string) {
    onChange(val);
  }
</script>

<Popover.Root>
  <Popover.Trigger
    class={cn(
      buttonVariants({
        variant: "outline",
        class: "w-[280px] justify-start text-left font-normal",
      }),
      !value && "text-muted-foreground",
    )}
  >
    <CalendarIcon class="mr-2 size-4" />
    {value ? df.format(value.toDate(getLocalTimeZone())) : "Pick a date"}
  </Popover.Trigger>
  <Popover.Content class="flex w-auto flex-col space-y-2 p-2">
    <Select.Root
      type="single"
      bind:value={
        () => valueString,
        (v) => {
          if (!v) return;
          value = today(getLocalTimeZone()).add({ days: Number.parseInt(v) });
        }
      }
    >
      <Select.Trigger>
        {valueString}
      </Select.Trigger>
      <Select.Content>
        {#each pausePresets as item (item.value)}
          <Select.Item value={`${item.value}`}>{item.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    <div class="rounded-md border">
      <Calendar
        type="single"
        bind:value
        minValue={today(getLocalTimeZone())}
        maxValue={today(getLocalTimeZone()).add({ days: 30 })}
        onValueChange={(val) => {
          changeFn(val ? val.toDate(getLocalTimeZone()).toISOString() : "");
        }}
      />
    </div>

    <TimePicker bind:time />
  </Popover.Content>
</Popover.Root>
