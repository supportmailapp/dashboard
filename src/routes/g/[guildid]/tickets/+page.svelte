<script lang="ts">
  import { page } from "$app/state";

  $effect(() => {
    if (page.data.dataState.saving) {
      // Perform actions when saving is true
      console.log("Saving state is true");
    } else {
      // Perform actions when saving is false
      console.log("Saving state is false");
    }
  });
</script>
