<script lang="ts">
  import { page } from "$app/state";
</script>

<div class="xy-center-items flex h-full w-full flex-col gap-y-5">
  <h1>{page.status}: {page.error?.message}</h1>
</div>
