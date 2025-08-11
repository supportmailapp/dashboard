<script lang="ts">
  import { Button } from "$ui/button";
  import Construction from "@lucide/svelte/icons/construction";
</script>

<div class="flex flex-col px-3 py-5">
  <Button onclick={() => history.back()} variant="outline" class="mx-auto">Back</Button>

  <div class="inline-flex w-full justify-center gap-3 p-10 text-lg italic select-none text-shadow-lg">
    <Construction />
    <span>Under construction</span>
    <Construction />
  </div>
</div>
