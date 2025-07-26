<script lang="ts">
  import { cn } from "$lib/utils";

  export type Props = {
    /**
     * Time-string in the format of `hh:mm`.
     */
    time: string;
  };

  let { time = $bindable() }: Props = $props();

  $inspect(time);
</script>

<input
  type="time"
  class={cn(
    "border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-muted-foreground flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    "w-fit",
  )}
  bind:value={time}
/>
