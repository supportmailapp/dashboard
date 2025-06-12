<script lang="ts">
  import { page } from "$app/state";
  import { userDisplayName } from "$lib/utils/formatting";
  import { toast } from "svelte-sonner";

  toast.error("Hello world!", {
    description: "This is a success message.",
    duration: 5000,
    position: "top-right",
    action: {
      label: "Dismiss",
      onClick: () => console.info("Dismiss clicked!"),
    },
  });
</script>

<!-- This page holds the home view for a specific guild; language setting can be changed here -->
<h1 class="text-3xl font-bold">
  Welcome <span class="from-primary to-secondary bg-gradient-to-br bg-clip-text text-transparent">
    {userDisplayName(page.data.user)}
  </span>!
</h1>
