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

  type Props = {
    value?: CalendarDate;
    /**
     * The function to run when the date or time changes.
     *
     * @param selectedDate ISO 8601 timestamp
     */
    onChange?: (selectedDate: string) => void;
    /**
     * The classes to apply to the popover content.
     */
    showError?: boolean;
  };

  let { onChange, value = $bindable<CalendarDate>(today(getLocalTimeZone())), showError }: Props = $props();

  const djs = dayjs();
  const df = new DateFormatter(navigator.language, {
    dateStyle: "long",
  });

  /**
   * Time-string in the format of `hh:mm`.
   */
  let time = $state<string>(djs.hour() + ":" + djs.minute());
  const valueString = $derived(value ? df.format(value.toDate(getLocalTimeZone())) : "");

  $inspect("DateTiemPicker[valueString]", valueString);

  function changeFn(val: string) {
    onChange?.(val);
  }

  function mergeDateAndTime(_date: CalendarDate, _time: string) {
    const [h, m] = _time.split(":");
    return dayjs(_date.toDate(getLocalTimeZone()).setHours(Number(h), Number(m)));
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
      showError && "text-destructive hover:text-destructive",
    )}
  >
    <CalendarIcon class="mr-2 size-4" />
    {value ? df.format(value.toDate(getLocalTimeZone())) : "Pick a date"}
  </Popover.Trigger>
  <Popover.Content class={cn("flex w-auto flex-col space-y-2 p-2", showError && "border-destructive")}>
    <Select.Root
      type="single"
      bind:value={
        () => valueString,
        (v) => {
          if (!v) return;
          value = today(getLocalTimeZone()).add({ days: Number.parseInt(v) });
          changeFn(mergeDateAndTime(value, time).toISOString());
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
          changeFn(val ? mergeDateAndTime(val as CalendarDate, time).toISOString() : "");
        }}
      />
    </div>

    <TimePicker
      bind:time={
        () => time,
        (v) => {
          time = v;
          changeFn(mergeDateAndTime(value, v).toISOString());
        }
      }
    />
  </Popover.Content>
</Popover.Root>
