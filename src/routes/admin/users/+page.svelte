<script lang="ts">
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import * as Table from "$ui/table/index.js";
  import * as Dialog from "$ui/dialog/index.js";
  import * as Avatar from "$ui/avatar/index.js";
  import * as Select from "$ui/select/index.js";
  import * as Field from "$ui/field/index.js";
  import Badge from "$ui/badge/badge.svelte";
  import Input from "$ui/input/input.svelte";
  import Skeleton from "$ui/skeleton/skeleton.svelte";
  import Button, { buttonVariants } from "$ui/button/button.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import { fetchUser } from "$lib/stores/users.svelte";
  import { type IDBUser, UserRole } from "$lib/sm-types";
  import { toast } from "svelte-sonner";
  import apiClient from "$lib/utils/apiClient.js";
  import { parseIconToURL } from "$lib/utils";

  let { data } = $props();

  class SelectedUser {
    dialogOpen = $state(false);
    selected = $state<IDBUser | null>(null);
    saving = $state(false);

    select(id: string) {
      const user = data.users.find((u) => u.id === id);
      if (user) {
        this.selected = user;
        this.dialogOpen = true;
      } else {
        toast.warning("User not found");
      }
    }

    async save() {
      if (!this.selected) return;
      
      const res = await apiClient.patch<IDBUser | { message: string }>(`/api/v1/admin/users`, {
        json: {
          id: $state.snapshot(this.selected.id),
          roles: $state.snapshot(this.selected.roles),
        }
      });

      const jsonRes = await res.json();
      if (res.ok && "id" in jsonRes) {
        toast.success("User updated successfully!");
        this.dialogOpen = false;
        const index = data.users.findIndex((u) => u.id === this.selected?.id);
        if (index !== -1) {
          data.users[index] = jsonRes;
        }
      } else if (!res.ok && "message" in jsonRes) {
        toast.error(jsonRes.message);
      } else {
        toast.error("An unknown error occurred.");
      }
    }
  }
  const selected = new SelectedUser();
  
  class NewUser {
    dialogOpen = $state(false);
    id = $state("");
    roles = $state<UserRole[]>([UserRole.User]);
    saving = $state(false);
  
    setRoles(roles: UserRole[]) {
      const includesUser = roles.includes(UserRole.User);
      if (!includesUser) toast.warning("User role is mandatory and cannot be removed!")
      this.roles = !includesUser ? [...roles, UserRole.User] : roles;
    }

    async save() {
      this.saving = true;
      const res = await apiClient.post<IDBUser | { message: string }>("/api/v1/admin/users", {
        json: {
          id: $state.snapshot(this.id),
          roles: $state.snapshot(this.roles),
        }
      });

      const jsonRes = await res.json();

      if (res.ok && "id" in jsonRes) {
        toast.success("User added successfully!");
        this.dialogOpen = false;
        this.id = "";
        this.roles = [UserRole.User];
        data.users = [...data.users, jsonRes];
      } else if (!res.ok && "message" in jsonRes) {
        toast.error(jsonRes.message);
      } else {
        toast.error("An unknown error occurred.");
      }
      this.saving = false;
    }
  }
  const newUser = new NewUser();

  $inspect(newUser.roles);
</script>

{#snippet roleBadges(roles: UserRole[])}
  {#each roles as role}
    {@const className = role === UserRole.Admin ? "bg-red-500/10 text-red-500" : role === UserRole.Moderator ? "bg-yellow-500/10 text-yellow-500" : ""}
    <Badge variant="outline" class="border {className}">{UserRole[role]}</Badge>
  {/each}
{/snippet}

<div class="flex items-center justify-start mb-4">
  <Dialog.Root>
    <Dialog.Trigger class={buttonVariants({ variant: "default" })}>
      <Plus />
      Add User
    </Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Add User</Dialog.Title>
        <Dialog.Description>
          Add a user to the dashboard by their Discord ID.
        </Dialog.Description>
      </Dialog.Header>
      <Field.Group>
        <Field.Field orientation="responsive">
          <Field.Label class="w-24">User ID</Field.Label>
          <Input type="text" placeholder="123456789012345678" bind:value={() => newUser.id, (v) => newUser.id = /^\d+$/.test(v) ? v : newUser.id} />
        </Field.Field>
        
        <Field.Field orientation="responsive">
          <Field.Label>Roles</Field.Label>
          <Select.Root type="multiple" bind:value={() => newUser.roles.map(String), (v) => newUser.setRoles(v.map(Number) as UserRole[])}>
            <Select.Trigger class={buttonVariants({ variant: "outline" })}>
              Select Roles
            </Select.Trigger>
            <Select.Content>
              {#each (Object.values(UserRole).filter(r => typeof r === "number")) as role}
                <Select.Item value={String(role)}>{UserRole[role]}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </Field.Field>
      </Field.Group>

      <Dialog.Footer>
        <Button variant="outline">Cancel</Button>
        <Button onclick={async () => newUser.save()} disabled={newUser.saving} showLoading={newUser.saving}>
          Save
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
</div>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>User</Table.Head>
      <Table.Head>Roles</Table.Head>
      <Table.Head class="w-20"></Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each data.users as user}
      <Table.Row>
        <Table.Cell>
          {#await fetchUser(user.id)}
            <Skeleton class="h-5 w-32" />
          {:then userData}
            {#if userData}
              <div class="flex items-center gap-2">
                <Avatar.Root class="aspect-square size-8">
                  <Avatar.Image src={parseIconToURL(userData.avatar, userData.id, "user", 64)} alt={userData.username} />
                  <Avatar.Fallback>{userData.username.slice(0, 2).toUpperCase()}</Avatar.Fallback>
                </Avatar.Root>
                <Mention userId={user.id} />
              </div>
            {:else}
              <span>{user.id}</span>
            {/if}
          {:catch}
            <span>{user.id}</span>
          {/await}
        </Table.Cell>
        <Table.Cell class="gap-1 flex flex-wrap">{@render roleBadges(user.roles || [])}</Table.Cell>
        <Table.Cell>
          <Button
            variant="outline"
            onclick={() => selected.select(user.id)}
          >
            <Pencil />
          </Button>
        </Table.Cell>
      </Table.Row>
    {/each}
    {#if data.users.length === 0}
      <Table.Row>
        <Table.Cell colspan={3} class="text-center text-muted-foreground">
          No users found.
        </Table.Cell>
      </Table.Row>
    {/if}
  </Table.Body>
</Table.Root>

<Dialog.Root bind:open={selected.dialogOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Edit User</Dialog.Title>
      <Dialog.Description>
        Modify the user's roles.
      </Dialog.Description>
    </Dialog.Header>
    {#if selected.selected}
      <Mention userId={selected.selected.id} />

      <Field.Field orientation="responsive">
        <Field.Label>Roles</Field.Label>
        <Select.Root type="multiple" bind:value={() => selected.selected!.roles?.map(String) || [], (v) => selected.selected!.roles = v.map(Number) as UserRole[]}>
          <Select.Trigger class={buttonVariants({ variant: "outline" })}>
            Select Roles
          </Select.Trigger>
          <Select.Content>
            {#each (Object.values(UserRole).filter(r => typeof r === "number")) as role}
              <Select.Item value={String(role)}>{UserRole[role]}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Dialog.Footer>
        <Button variant="outline" onclick={() => selected.dialogOpen = false}>Close</Button>
        <Button onclick={async () => selected.save()} disabled={selected.saving} showLoading={selected.saving}>
          Save
        </Button>
      </Dialog.Footer>
    {:else}
      <div class="p-4 text-center">
        User not found.
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>