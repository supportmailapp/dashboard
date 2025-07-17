<script lang="ts" module>
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
  import { type VariantProps, tv } from "tailwind-variants";

  const buttonVariants = tv({
    base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4",
    variants: {
      variant: {
        default: "bg-primary-foreground text-primary shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive-forground text-destructive shadow-xs hover:bg-destructive-foreground/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive-foreground/60",
        outline:
          "bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border",
        secondary:
          "bg-secondary-foreground text-secondary shadow-xs hover:bg-secondary-foreground/80 focus-visible:ring-secondary/20 dark:focus-visible:ring-secondary/40 dark:bg-secondary-foreground/60",
        ghost: "hover:bg-accent-foreground hover:text-accent dark:hover:bg-accent-foreground/50",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-success-foreground text-success shadow-xs hover:bg-success-foreground/80 focus-visible:ring-success/20 dark:focus-visible:ring-success/40 dark:bg-success-foreground/60",
        warning:
          "bg-warning-foreground text-warning shadow-xs hover:bg-warning-foreground/80 focus-visible:ring-warning/20 dark:focus-visible:ring-warning/40 dark:bg-warning-foreground/60",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 gap-1.5 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  });

  type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
  type ButtonSize = VariantProps<typeof buttonVariants>["size"];

  type ButtonProps = WithElementRef<HTMLButtonAttributes> &
    WithElementRef<HTMLAnchorAttributes> & {
      variant?: ButtonVariant;
      size?: ButtonSize;
    };
</script>

<script lang="ts">
  let {
    class: className,
    variant = "default",
    size = "default",
    ref = $bindable(null),
    href = undefined,
    type = "button",
    disabled,
    children,
    ...restProps
  }: ButtonProps = $props();
</script>

{#if href}
  <a
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    href={disabled ? undefined : href}
    aria-disabled={disabled}
    role={disabled ? "link" : undefined}
    tabindex={disabled ? -1 : undefined}
    {...restProps}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    {type}
    {disabled}
    {...restProps}
  >
    {@render children?.()}
  </button>
{/if}
