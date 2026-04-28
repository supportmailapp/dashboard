<script>
  import * as Avatar from "$ui/avatar";
  import * as Sidebar from "$ui/sidebar";
  import { slide } from "svelte/transition";

  const sidebar = Sidebar.useSidebar();
</script>

<a href="/" class="flex items-center gap-2 transition-opacity duration-150 hover:opacity-70">
  {#if !sidebar?.isMobile}
    <span class="text-lg font-bold" transition:slide={{ duration: 200, axis: "x" }}>SupportMail</span>
  {/if}
  <Avatar.Root class="aspect-square size-8">
    <Avatar.Image src="/logo.png" alt="Logo" />
    <Avatar.Fallback>SM</Avatar.Fallback>
  </Avatar.Root>
</a>
