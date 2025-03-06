<script lang="ts">
  import { APIRoutes, DEFAULT_DBUSER, LANGUAGES } from "$lib/constants";
  import { site } from "$lib/stores/site.svelte";
  import { user as userState } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import equal from "fast-deep-equal/es6";
  import type { IDBUser } from "supportmail-types";
  import { slide } from "svelte/transition";

  // Constants
  const AlertClassNames: any = {
    success: "dy-alert-success",
    error: "dy-alert-error",
    warning: "dy-alert-warning",
    info: "dy-alert-info",
  };

  // Declarations
  let { showModal = $bindable<boolean>(false) } = $props();
  let dialog = $state<HTMLDialogElement | undefined>(undefined);
  let user = $derived(userState.discord! || {});
  let dbUser = $derived(userState.db);
  let newDbUser = $state<IDBUser>(DEFAULT_DBUSER);
  let notifications = $state<{ message: string; status: string }[]>([]);

  // Effects
  $effect(() => {
    if (showModal) dialog?.showModal();
  });

  $effect(() => {
    // If the dbUser is finally loaded, set the newDbUser to the dbUser - only once, which is why we check if the newDbUser is the default
    if (dbUser && equal(newDbUser, DEFAULT_DBUSER)) newDbUser = $state.snapshot(dbUser);
  });

  $effect(() => {
    if (notifications.length > 0) {
      setTimeout(() => {
        notifications.shift();
      }, 3000);
    }
  });

  // Functions
  const handleEsc = (event: KeyboardEvent) => {
    if (event.key === "Escape") showModal = false;
  };

  async function userSaveFunction(event: SubmitEvent) {
    event.preventDefault();
    if (newDbUser.id === "" || equal(newDbUser, dbUser)) {
      if (notifications.length > 10) return;
      notifications.push({
        message: "No changes to save",
        status: "error",
      });
      setTimeout(() => {
        notifications.shift();
      }, 3000);
      return;
    }
    site.saving = true;
    try {
      const res = await fetch(APIRoutes.user(newDbUser.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDbUser),
      });

      if (!res.ok) {
        throw {
          message: `Failed to save user settings: ${res.status} ${res.statusText}`,
          status: res.status,
          response: res,
        };
      }

      const data = (await res.json()) as IDBUser;
      userState.db = data;
      newDbUser = data;
      notifications.push({
        message: "Settings saved",
        status: "success",
      });
    } catch (err) {
      console.error(err);
    } finally {
      site.saving = false;
    }
  }
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
  <div class="dy-modal-box bg-base-300 flex min-h-1/2 w-full max-w-full overflow-visible sm:min-h-auto">
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

          <button class="dy-btn dy-btn-error dy-btn-outline mt-auto w-full" onclick={() => (location.href = APIRoutes.logout())}>
            <img src="/icons/logout.svg" alt="Logout" class="size-6 object-cover" />
            Logout
          </button>
        </div>
        <div class="dy-divider sm:dy-divider-horizontal"></div>
        <form class="userdata" onsubmit={userSaveFunction}>
          <fieldset>
            <legend class="overflow-visible text-lg">
              Language
              <div class="dy-dropdown dy-dropdown-end">
                <button
                  class="dy-btn dy-btn-circle dy-btn-ghost dy-btn-xs text-info"
                  onclick={(e) => {
                    e.preventDefault();
                    confirm(
                      "The information on the language is in the documentation due to the complexity.\nDo you want to continue?",
                    ) && window.open("https://docs.supportmail.dev/f/preferences#localization-languages", "_blank");
                  }}
                >
                  <img src="/icons/question-mark-circle.svg" alt="Help" class="size-5" />
                </button>
              </div>
            </legend>
            <select id="language" class="w-full" bind:value={newDbUser.language}>
              {#each LANGUAGES as lang}
                <option value={lang.value} selected={dbUser?.language === lang.value}>{lang.name}</option>
              {/each}
            </select>
          </fieldset>
          <span class="h-1"></span>
          <fieldset>
            <legend class="overflow-visible text-lg">
              Automatic Redirect
              <div class="dy-dropdown dy-dropdown-end">
                <div tabindex="0" role="button" class="dy-btn dy-btn-circle dy-btn-ghost dy-btn-xs text-info p-0">
                  <img src="/icons/question-mark-circle.svg" alt="Help" class="size-5" />
                </div>
                <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                <div tabindex="0" class="dy-card dy-card-sm dy-dropdown-content bg-base-200 rounded-box z-1 w-max shadow-sm">
                  <div class="dy-card-body">
                    <p>By default, you have to confirm to which server you want to send direct messages to.</p>
                    <p>When <b>enabled</b>, your direct messages will be automatically redirected to the last active ticket.</p>
                    <p>When <b>disabled</b>, You have to confirm every message before it's getting sent into a ticket.</p>
                  </div>
                </div>
              </div>
            </legend>
            <label class="text-lg text-white">
              <input
                id="auto_redirect"
                type="checkbox"
                bind:checked={newDbUser.autoRedirect}
                class="dy-toggle dy-toggle-primary"
              />{newDbUser.autoRedirect ? "ON" : "OFF"}
            </label>
          </fieldset>
          <span class="h-1"></span>
          <div class="flex h-full w-full items-end justify-end">
            <button type="submit" class="dy-btn-success dy-btn-outline w-full" disabled={site.saving || newDbUser.id === ""}>
              {#if site.saving}
                <span class="dy-loading dy-loading-infinity"></span>
              {:else}
                <img src="/icons/save.svg" alt="Save" class="size-6" />
                Save
              {/if}
            </button>
          </div>
        </form>
      </div>

      <div class="dy-modal-action w-full">
        <form method="dialog" class="w-full">
          <button class="dy-btn dy-btn-soft w-full" onclick={() => dialog?.close()}>
            <kbd class="dy-kbd">ESC</kbd>
            Close
          </button>
        </form>
      </div>
    </div>
  </div>

  {#if notifications.length > 0}
    <div class="dy-toast dy-toast-top dy-toast-end">
      {#each notifications as noti}
        <div class="dy-alert {AlertClassNames[noti.status]}">
          <span>{noti.message}</span>
        </div>
      {/each}
    </div>
  {/if}
</dialog>
