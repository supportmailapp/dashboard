<script lang="ts" module>
  import { tv, type VariantProps } from "tailwind-variants";

  export const saveAlertVariants = tv({
    base: "relative flex sm:flex-row flex-col justify-center items-center sm:justify-start w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm",
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "text-destructive bg-card *:data-[slot=alert-content]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  export type AlertVariant = VariantProps<typeof saveAlertVariants>["variant"];
</script>

<script lang="ts">
  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";
  import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
  import { scale } from "svelte/transition";

  let {
    ref = $bindable(null),
    class: className,
    variant = "default",
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    variant?: AlertVariant;
  } = $props();
</script>

<div
  bind:this={ref}
  data-slot="alert"
  class={cn(saveAlertVariants({ variant }), className)}
  {...restProps}
  role="alert"
  transition:scale={{ duration: 150 }}
>
  <CircleAlertIcon class="hidden size-4 md:block" />
  {@render children?.()}
</div>
