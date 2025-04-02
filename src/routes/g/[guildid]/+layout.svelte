<script lang="ts">
  import "./dashboard.css";
  import { page } from "$app/state";
  import DesktopNavigation from "$lib/components/DesktopNavigation.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { gg, loadGuildData } from "$lib/stores/guild.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { onMount } from "svelte";
  import ServerSelectDialog from "$lib/components/ServerSelectDialog.svelte";

  let { children } = $props();

  onMount(async () => {
    if (!(gg.guild && gg.roles && gg.channels)) await loadGuildData();
  });
</script>

<ServerSelectDialog />

<div class="page-wrapper">
  <div class="desktop-nav-wrapper">
    <DesktopNavigation />
  </div>
  <div class="content-wrapper">
    <main>
      {@render children()}
    </main>
  </div>
</div>
