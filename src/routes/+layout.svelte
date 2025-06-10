<script lang="ts">
  import "../app.css";

  let { children } = $props();
  let guildsSelectOpen = $state(false);
  let guilds = $state([
    { id: "123456789012345678", name: "Coding Haven", icon: "CH" },
    { id: "234567890123456789", name: "Gaming Guild", icon: "GG" },
    { id: "345678901234567890", name: "Music Lovers", icon: "ML" },
    { id: "456789012345678901", name: "Art Community", icon: "AC" },
    { id: "567890123456789012", name: "Tech Enthusiasts", icon: "TE" },
    { id: "678901234567890123", name: "Book Club", icon: "BC" },
    { id: "789012345678901234", name: "Travel Buddies", icon: "TB" },
  ]);
</script>

<div class="bg-background flex h-screen">
  {@render children()}
</div>
