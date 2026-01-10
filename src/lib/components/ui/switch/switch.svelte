<script lang="ts" module>
  import { tv, type VariantProps } from "tailwind-variants";

  export const switchVariants = tv({
    base: "focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 peer inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
    variants: {
      variant: {
        default: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        success: "data-[state=checked]:bg-success data-[state=unchecked]:bg-input",
        destructive: "data-[state=checked]:bg-destructive data-[state=unchecked]:bg-input",
      },
      size: {
        default: "h-[1.15rem] w-8",
        sm: "h-5 w-7",
        lg: "h-6 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  });

  const switchThumbSizes = {
    default: "size-4",
    sm: "size-3",
    lg: "size-5",
  };

  export type SwitchVariant = VariantProps<typeof switchVariants>["variant"];
  export type SwitchSize = VariantProps<typeof switchVariants>["size"];
</script>

<script lang="ts">
  import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";
  import { Switch as SwitchPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    class: className,
    checked = $bindable(false),
    variant = "default",
    size = "default",
    ...restProps
  }: WithoutChildrenOrChild<SwitchPrimitive.RootProps> & {
    variant?: SwitchVariant;
    size?: SwitchSize;
  } = $props();
</script>

<SwitchPrimitive.Root
  bind:ref
  bind:checked
  data-slot="switch"
  class={cn(switchVariants({ variant, size }), className)}
  {...restProps}
>
  <SwitchPrimitive.Thumb
    data-slot="switch-thumb"
    class={cn(
      "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
      switchThumbSizes[size],
    )}
  />
</SwitchPrimitive.Root>
