<script lang="ts">
  import "./serverSelect.css";
  import Footer from "$lib/components/Footer.svelte";
  import RefreshButton from "$lib/components/RefreshButton.svelte";
  import { guilds as guildsState, loadGuilds } from "$lib/stores/guilds.svelte";
  import { site } from "$lib/stores/site.svelte";
  import { user as userState } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { CircleArrowRight, Plus } from "@lucide/svelte";
  import { beforeNavigate } from "$app/navigation";

  let user = $derived(userState.discord as BasicUser);
  let guilds = $derived(guildsState.value as DCGuild[]);
  let firstNotConfiguredGuild = $derived.by(() => {
    if (guilds.length) {
      return guilds.find((guild) => !guild.isConfigured)?.id;
    }
  });

  beforeNavigate(({ complete }) => {
    site.showLoading = true;
    complete.catch(undefined).finally(() => {
      site.showLoading = false;
    });
  });
</script>

<div id="bg" style="background-image: url(https://picsum.photos/1920/1080);"></div>

<!-- Servers -->
<div class="h-screen w-screen flex-col items-center justify-center">
  <!-- It's needed to be in the wrapper because otherwise the layout breaks. Dunno why. -->
  <header class="bg-base-200">
    <nav class="dy-navbar mx-auto max-w-[1200px]">
      <div class="dy-navbar-start">
        <a
          href="https://supportmail.dev/"
          class="inline-flex items-center gap-x-3 gap-y-2 py-1 transition-opacity duration-100 select-none hover:opacity-70"
        >
          <img src="/logo.png" alt="Logo" class="size-12" />
          <span class="hidden text-3xl font-semibold text-white sm:block">SupportMail</span>
        </a>
      </div>

      <div class="dy-navbar-center justify-center">
        <RefreshButton
          text="Reload Servers"
          clickFunction={() => {
            site.showLoading = true;
            console.log("Reloading servers...");
            loadGuilds(true)
              .catch((reason) => {
                console.error("Failed to load guilds", reason);
              })
              .finally(() => {
                site.showLoading = false;
                console.log("Finished reloading servers");
              });
          }}
        />
      </div>
      <div class="dy-navbar-end">
        <a
          href="/@me"
          tabindex="0"
          class="hover:border-info cursor-pointer rounded-2xl border-2 border-transparent transition-all duration-100 ease-in-out"
        >
          <img src={cdnUrls.userAvatar(user.id, user.avatar, "64")} alt="User Avatar" class="size-12 rounded-2xl object-cover" />
        </a>
      </div>
    </nav>
  </header>

  <div class="main-container">
    <div class="bg-base-200 w-full shrink overflow-y-auto rounded-lg inset-shadow-sm">
      <div
        class="flex h-full max-h-fit w-full flex-col items-start justify-start gap-2 p-3 text-center"
        class:fade-bottom={guilds.length == 0 || site.showLoading}
      >
        {#if guilds.length == 0 || site.showLoading}
          {#each Array(5) as _}
            <div class="flex w-full flex-row items-center justify-between gap-2">
              <div class="flex items-center justify-center p-2">
                <div class="dy-avatar">
                  <div class="dy-mask dy-mask-squircle size-12">
                    <div class="dy-skeleton size-full"></div>
                  </div>
                </div>
              </div>
              <div class="flex w-3/5 justify-center truncate">
                <span class="dy-skeleton block h-[1rem] w-32 rounded"></span>
              </div>
              <div class="block min-w-fit items-center justify-center px-2">
                <div class="dy-skeleton size-5 rounded-full"></div>
              </div>
            </div>
          {/each}
        {:else}
          {#each guilds as guild}
            {#if firstNotConfiguredGuild === guild.id}
              <span class="dy-divider my-1"></span>
            {/if}
            <a
              class="root-server-select-row {!guild.isConfigured ? 'opacity-40 hover:opacity-100' : ''}"
              href="/{guild.isConfigured ? 'g/' : 'add/'}{guild.id}"
            >
              <div class="flex items-center justify-center p-2">
                <div class="dy-avatar">
                  <div class="dy-mask dy-mask-squircle size-12">
                    <img src={cdnUrls.guildIcon(guild.id, guild.icon)} alt={guild.name} />
                  </div>
                </div>
              </div>
              <div class="flex max-w-3/5 min-w-1/5 justify-center truncate">
                <span class="block w-fit truncate">{guild.name}</span>
              </div>
              <div class="block min-w-fit items-center justify-center px-2">
                {#if guild.isConfigured}
                  <CircleArrowRight class="size-5" />
                {:else}
                  <Plus class="size-5" />
                {/if}
              </div>
            </a>
          {/each}
        {/if}
      </div>
    </div>
    <Footer />
  </div>
  <!-- <div class="footer-container-wrapper">
    <Footer />
  </div> -->
</div>

<style>
  :root {
    --header-height: 70px;
  }

  header {
    height: var(--header-height);
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    z-index: 20;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
  }

  .main-container {
    height: calc(100vh - var(--header-height));
    max-height: 1080px;
    padding: 10px;
    margin-inline: auto;
    max-width: 650px;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    overflow-x: clip;
    overflow-y: auto;
    font-size: 1rem;
    line-height: 1.5;
    z-index: 20;
  }

  #bg {
    width: 100vw;
    height: 100vh;
    position: absolute;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    object-fit: cover;
    backdrop-filter: blur(0.75vh);
    filter: blur(0.75vh);
    -webkit-filter: blur(0.75vh);
    box-shadow: 0 0 200px rgb(0, 0, 0);
    z-index: -1;
  }

  .fade-bottom {
    position: relative;
  }

  .fade-bottom::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 90%;
    background: linear-gradient(to bottom, rgb(255, 255, 255, 0) 0%, var(--color-base-200) 100%);
    pointer-events: none;
  }
</style>
