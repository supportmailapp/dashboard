<script lang="ts">
  import AppSidebar from "$lib/components/mod-sidebar.svelte";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { getBreadcrumbs } from "./breadcrumb.svelte";

  const crumbs = getBreadcrumbs();
</script>

asdasd