<script lang="ts">
  import { page } from "$app/state";
  import Branding from "$lib/assets/Branding.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import * as Alert from "$ui/alert/index.js";
  import * as Card from "$ui/card/index.js";
  import * as Table from "$ui/table/index.js";

  let guildManager = $derived(page.data.guildsManager);
</script>

<div id="bg" style="background-image: url(https://picsum.photos/1920/1080.webp);"></div>
<a
  href="https://picsum.photos/"
  target="_blank"
  rel="noopener noreferrer"
  class="text-opacity-50 absolute right-3 bottom-3 z-50 text-[0.6rem] text-slate-600 hover:text-slate-400"
>
  Photo by <b>Picsum Photos</b>
</a>

<div class="flex h-screen flex-col items-center justify-center gap-6 px-3">
  <Card.Root class="w-full max-w-md shadow-2xl shadow-black/50 select-none">
    <Card.Header class="text-center">
      <Branding />
    </Card.Header>
    <Card.Content style="width: 100%">
      {#if guildManager.loaded}
        <div class="grid h-fit w-full place-items-center py-3">
          <LoadingSpinner size="12" />
        </div>
      {:else}
        <Table.Root>
          <Table.Caption>
            <!-- This is actually the footer for this page -->
          </Table.Caption>
        </Table.Root>
      {/if}
    </Card.Content>
  </Card.Root>
</div>

<style>
  #bg {
    width: 100%;
    height: 100%;
    position: absolute;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    object-fit: cover;
    backdrop-filter: blur(0.75vh);
    filter: blur(0.75vh);
    -webkit-filter: blur(0.75vh);
    box-shadow: 0 0 200px rgba(0, 0, 0, 0.9) inset;
    z-index: -1;
  }
</style>
