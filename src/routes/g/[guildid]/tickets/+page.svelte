<script lang="ts">
  import { saving } from "$lib/stores/config.svelte";

  $effect(async () => {
    if ($saving) {
      // Perform actions when saving is true
      console.log("Saving state is true");
    } else {
      // Perform actions when saving is false
      console.log("Saving state is false");
    }
  });

  saving.subscribe(async (value) => {
    if (value) {
      // Perform actions when saving is true
      console.log("Saving state is true");
    } else {
      // Perform actions when saving is false
      console.log("Saving state is false");
    }
  });
</script>
