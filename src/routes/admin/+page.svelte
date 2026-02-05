<script lang="ts">
  import Button from "$ui/button/button.svelte";
  import Separator from "$ui/separator/separator.svelte";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
</script>

<p>Do admin stuff here</p>

<Separator class="my-4" />

<Button variant="link" href="/admin/users">
  Users
  <ArrowRight />
</Button>
