<script lang="ts">
  import { saving } from "$lib/stores/config.svelte";

  $effect(() => {
    if (saving.value) {
      // Perform actions when saving is true
      console.log("Saving state is true");
    } else {
      // Perform actions when saving is false
      console.log("Saving state is false");
    }
  });
</script>
