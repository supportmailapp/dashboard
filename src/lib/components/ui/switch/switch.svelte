<script lang="ts" module>
  import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";
  import { tv, type VariantProps } from "tailwind-variants";

  export const switchVariants = tv({
    base: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
    variants: {
      variant: {
        default: "bg-input",
        success: "data-[state=checked]:bg-green-400",
        destructive: "data-[state=unchecked]:bg-destructive data-[state=checked]:bg-input",
      },
    },
  });

  export type SwitchVariant = VariantProps<typeof switchVariants>["variant"];
</script>

<script lang="ts">
  import { Switch as SwitchPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    class: className,
    checked = $bindable(false),
    variant = "default",
    ...restProps
  }: WithoutChildrenOrChild<SwitchPrimitive.RootProps> & {
    variant?: SwitchVariant;
  } = $props();
</script>

<SwitchPrimitive.Root
  bind:ref
  bind:checked
  data-slot="switch"
  class={cn(switchVariants({ variant: variant }), className)}
  {...restProps}
>
  <SwitchPrimitive.Thumb
    data-slot="switch-thumb"
    class={cn(
      "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
    )}
  />
</SwitchPrimitive.Root>
