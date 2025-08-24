<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { buttonVariants } from "$ui/button/index.js";
  import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

  let { ref = $bindable(null), class: className, ...restProps }: AlertDialogPrimitive.ActionProps = $props();
</script>

<AlertDialogPrimitive.Action
  bind:ref
  data-slot="alert-dialog-action"
  class={cn(buttonVariants({ variant: "default" }), className, "select-none")}
  {...restProps}
/>
