<script lang="ts">
  import { loadDbUser, user as userState } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import type { APIUser } from "discord-api-types/v10";
  import type { IDBUser } from "supportmail-types";
  import { onMount } from "svelte";

  type UserProfile =
    | (Pick<BasicUser, "id" | "avatar" | "username" | "displayName"> & Pick<IDBUser, "language" | "autoRedirect">)
    | null;

  let deleteModalOpen = $state(false);
  let user = $derived<UserProfile>(
    userState.db && userState.discord
      ? {
          id: userState.db.id,
          avatar: userState.discord.avatar,
          username: userState.discord.username,
          displayName: userState.discord.displayName,
          language: userState.db.language,
          autoRedirect: userState.db.autoRedirect,
        }
      : null,
  );

  function handleDeleteAccount() {
    console.log("Account deleted");
    deleteModalOpen = false;
  }

  onMount(async () => {
    await loadDbUser();
  });
</script>

<div class="container mx-auto max-w-3xl space-y-8 p-4 pt-10">
  <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Account Settings</h1>
      <p class="text-base-content/70">Manage your preferences</p>
    </div>
    <button class="btn btn-primary">Save changes</button>
  </div>

  <div class="card bg-base-100 shadow-xl">
    <div class="card-body items-center">
      <h2 class="card-title">Profile</h2>
      <p class="text-base-content/70">Update your personal information.</p>

      <div class="w-full space-y-6">
        <div class="flex flex-col items-center gap-6">
          <div class="avatar">
            <div class="w-24 rounded-full">
              <img src={user ? cdnUrls.userAvatar(user.id, user.avatar) : ""} alt={user?.displayName || ""} />
            </div>
          </div>
          <div class="flex flex-col items-center space-y-2">
            <button class="btn btn-outline">Change avatar</button>
            <p class="text-base-content/70 hidden text-center text-xs md:flex">
              Recommended: Square JPG, PNG, or GIF, at least 400x400.
            </p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="form-control w-full">
            <label class="label" for="name">
              <span class="label-text">Name</span>
            </label>
            <input type="text" id="name" value={user?.displayName || ""} class="input input-bordered w-full" />
          </div>
          <div class="form-control w-full">
            <label class="label" for="email">
              <span class="label-text">Email</span>
            </label>
            <input type="email" id="email" value={user?.username || ""} class="input input-bordered w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Notifications</h2>
      <p class="text-base-content/70">Configure how you receive notifications.</p>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="label-text">Email notifications</p>
            <p class="text-base-content/70 text-sm">Receive emails about your account activity.</p>
          </div>
          <input type="checkbox" class="toggle" />
        </div>
        <div class="divider my-1"></div>
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="label-text">Push notifications</p>
            <p class="text-base-content/70 text-sm">Receive push notifications on your device.</p>
          </div>
          <input type="checkbox" class="toggle" />
        </div>
        <div class="divider my-1"></div>
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="label-text">Marketing emails</p>
            <p class="text-base-content/70 text-sm">Receive emails about new products and features.</p>
          </div>
          <input type="checkbox" class="toggle" />
        </div>
      </div>
    </div>
  </div>

  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Danger Zone</h2>
      <p class="text-base-content/70">Irreversible and destructive actions.</p>

      <div class="space-y-4">
        <div class="space-y-2">
          <h4 class="font-medium">Delete Account</h4>
          <p class="text-base-content/70 text-sm">Permanently delete your account and all associated data.</p>
        </div>
        <button class="btn btn-error" onclick={() => (deleteModalOpen = true)}>Delete Account</button>
      </div>
    </div>
  </div>
</div>

<!-- Add modal at the end of the container -->
<dialog class="modal" class:modal-open={deleteModalOpen}>
  <div class="modal-box">
    <h3 class="text-lg font-bold">Delete Account</h3>
    <p class="py-4">Are you sure you want to delete your account? This action cannot be undone.</p>
    <div class="modal-action">
      <button class="btn" onclick={() => (deleteModalOpen = false)}>Cancel</button>
      <button class="btn btn-error" onclick={handleDeleteAccount}>Delete</button>
    </div>
  </div>
  <button class="modal-backdrop" aria-label="modal backdrop" onclick={() => (deleteModalOpen = false)}></button>
</dialog>
