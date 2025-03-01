<script lang="ts">
  import { cdnUrls } from "$lib/utils/formatting";
  import { LANGUAGES } from "$lib/constants";
  import { user as userState } from "$lib/stores/user.svelte";
  import { site } from "$lib/stores/site.svelte";
  import { slide } from "svelte/transition";
  import { userSaveFunction } from "$lib/utils/clientStuff";

  let { showModal = $bindable<boolean>(false) } = $props();

  let dialog = $state<HTMLDialogElement | undefined>(undefined);

  $effect(() => {
    if (showModal) dialog?.showModal();
  });

  let user = $derived(userState.discord! || {});
  let dbUser = $derived(userState.db! || {});

  const handleEsc = (event: KeyboardEvent) => {
    if (event.key === "Escape") showModal = false;
  };
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  id="profile"
  class="dy-modal dy-modal-bottom sm:dy-modal-middle text-base-content w-full"
  onclose={() => (showModal = false)}
  onkeydown={handleEsc}
  transition:slide={{ axis: "y", duration: 150 }}
>
  <div class="dy-modal-box flex min-h-1/2 w-full max-w-full overflow-visible">
    <div class="flex w-full flex-col items-center justify-center">
      <div class="flex h-full w-full flex-col sm:flex-row">
        <div class="flex w-full flex-col items-start justify-start gap-y-2 sm:w-2/5">
          <div class="dy-avatar">
            <div class="dy-mask dy-mask-squircle size-20">
              <img src={cdnUrls.userAvatar(user.id, user.avatar, "128")} alt="User Avatar" />
            </div>
          </div>
          <span class="text-2xl font-bold">@{user.username}</span>
          <span class="text-lg">{user.displayName}</span>

          <button type="submit" class="dy-btn dy-btn-error dy-btn-outline mt-auto w-full">
            <img src="/logout.svg" alt="Logout" class="block size-7 object-cover" />
          </button>
        </div>
        <div class="dy-divider sm:dy-divider-horizontal"></div>
        <div class="flex w-full flex-col gap-y-2 sm:w-3/5">
          <form class="userdata" onsubmit={userSaveFunction}>
            <fieldset class="dy-fieldset">
              <legend class="dy-fieldset-legend">Language</legend>
              <select id="language" class="w-full" bind:value={dbUser.language}>
                {#each LANGUAGES as lang}
                  <option value={lang.value} selected={dbUser?.language === lang.value}>{lang.name}</option>
                {/each}
              </select>
            </fieldset>
            <span></span>
            <fieldset class="dy-fieldset">
              <legend class="dy-fieldset-legend truncate overflow-visible">
                Automatic Redirect
                <a href="https://docs.supportmail.dev/f/preferences#auto-redirect" target="_blank" class="cursor-pointer">
                  <img src="/question-mark-circle.svg" alt="Help" class="size-4" />
                </a>
              </legend>
              <label class="dy-fieldset-label">
                <input type="checkbox" bind:checked={dbUser.autoRedirect} class="dy-toggle dy-toggle-primary" />
                {dbUser.autoRedirect ? "ON" : "OFF"}
              </label>
            </fieldset>
            <button type="submit" class="mt-auto grow" disabled={site.saving}>Save</button>
          </form>
        </div>
      </div>

      <div class="dy-modal-action w-full">
        <form method="dialog" class="w-full">
          <!-- svelte-ignore a11y_autofocus -->
          <button class="dy-btn dy-btn-soft w-full" autofocus onclick={() => dialog?.close()}>
            <kbd class="dy-kbd">ESC</kbd>
            Close
          </button>
        </form>
      </div>
    </div>
  </div>
</dialog>
