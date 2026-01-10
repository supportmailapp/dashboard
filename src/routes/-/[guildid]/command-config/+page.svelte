<script lang="ts">
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import * as Card from "$ui/card/index.js";
  import * as Select from "$ui/select/index.js";
  import * as Field from "$ui/field/index.js";
  import * as Popover from "$ui/popover/index.js";
  import SettingsGrid from "$lib/components/SettingsGrid.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import { SpecialChannelType, type APICommandConfig } from "$lib/sm-types";
  import { cn, determineUnsavedChanges } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { APIRoutes } from "$lib/urls";
  import { page } from "$app/state";
  import { PUBLIC_BLACKLIST_COMMAND_ID } from "$env/static/public";
  import { afterNavigate } from "$app/navigation";
  import Mention from "$lib/components/discord/Mention.svelte";
  import ChannelSelect from "$lib/components/discord/ChannelSelect.svelte";
  import { buttonVariants } from "$ui/button";
  import Plus from "@lucide/svelte/icons/plus";
  import { ChannelType } from "discord-api-types/v10";
  import { fade } from "svelte/transition";
  import RoleSelect from "$lib/components/discord/RoleSelect.svelte";
  import UserSelect from "$lib/components/discord/UserSelect.svelte";
  import { GetPermissionsArray, PermissionFlagsBits } from "$lib/utils/permissions.js";
  import Combobox from "$ui/combobox/Combobox.svelte";
  import { BitField } from "$lib/utils/bitfields";
  import { toast } from "svelte-sonner";

  const Subcommands = [
    { label: "/blacklist add", value: "blacklist/add" },
    { label: "/blacklist remove", value: "blacklist/remove" },
    { label: "/blacklist view", value: "blacklist/view" },
    { label: "/blacklist clear", value: "blacklist/clear" },
    { label: "/blacklist check", value: "blacklist/check" },
  ];
  const StringifiedPermissions = GetPermissionsArray(true);

  let oldCommands: Record<string, APICommandConfig> | null = null;
  let commands = $state<Record<string, APICommandConfig> | null>(null);
  let loading = $state(true);
  let unsaved = $derived(determineUnsavedChanges(oldCommands, $state.snapshot(commands)));

  // All have the same id
  let selectedSubcommandPath = $state("");
  let selectedSubcommand = $derived(
    selectedSubcommandPath && commands ? commands[selectedSubcommandPath] : null,
  );

  function addIdToSelected<K extends keyof Pick<APICommandConfig, "channels" | "roles" | "users">>(
    data: APICommandConfig[K][number],
    key: K,
  ) {
    if (!commands || !selectedSubcommandPath) return;
    commands[selectedSubcommandPath][key] = [...selectedSubcommand![key], data as any];
  }

  function removeFromSelected<K extends keyof Pick<APICommandConfig, "channels" | "roles" | "users">>(
    data: APICommandConfig[K][number],
    key: K,
  ) {
    if (!commands || !selectedSubcommandPath) return;
    if (key === "channels") {
      commands[selectedSubcommandPath][key] = selectedSubcommand![key].filter(
        (v) => typeof v !== "string" && v.id !== (data as any).id,
      ) as APICommandConfig[K];
    } else {
      commands[selectedSubcommandPath][key] = selectedSubcommand![key].filter(
        (v) => v !== data,
      ) as APICommandConfig[K];
    }
  }

  async function fetchCommand() {
    const res = await apiClient.get<APICommandConfig[]>(
      APIRoutes.commandConfig(page.params.guildid!, PUBLIC_BLACKLIST_COMMAND_ID),
    );

    selectedSubcommandPath = "";
    if (res.ok) {
      const jsonData = await res.json();
      commands = jsonData.reduce(
        (acc, cmd) => {
          acc[cmd.commandPath] = cmd;
          return acc;
        },
        {} as Record<string, APICommandConfig>,
      );
      oldCommands = $state.snapshot(commands);
    } else if (res.status === 404) {
      // Mock data
      commands = Subcommands.map((sub) => sub.value).reduce(
        (acc, path) => {
          acc[path] = {
            id: PUBLIC_BLACKLIST_COMMAND_ID,
            guildId: page.params.guildid!,
            commandPath: path,
            channels: [],
            roles: [],
            users: [],
            permissions: PermissionFlagsBits.ManageGuild.toString(),
          };
          return acc;
        },
        {} as Record<string, APICommandConfig>,
      );
      oldCommands = $state.snapshot(commands);
    } else {
      commands = null;
      oldCommands = null;
    }
  }

  async function saveChanges() {
    if (!commands) return;
    loading = true;

    const res = await apiClient.put(
      APIRoutes.commandConfig(page.params.guildid!, PUBLIC_BLACKLIST_COMMAND_ID),
      {
        json: Object.values($state.snapshot(commands)),
      },
    );

    if (res.ok) {
      await fetchCommand();
    }

    loading = false;
  }

  function discardChanges() {
    if (oldCommands) {
      commands = { ...oldCommands };
    }
  }

  afterNavigate(async () => {
    await fetchCommand();
    loading = false;
  });

  let selectedPermissions = $derived.by(() => {
    if (!selectedSubcommand?.permissions) return [];
    return new BitField(selectedSubcommand.permissions)
      .getSetBits()
      .map((b) => (BigInt(1) << BigInt(b)).toString(10));
  });

  function updatePermissions(vals: string[]) {
    if (!commands || !selectedSubcommandPath) return;
    const bitfield = new BitField();
    for (const val of vals) {
      bitfield.set(BigInt(val));
    }
    commands[selectedSubcommandPath].permissions = bitfield.bits.toString();
  }

  function permissionsFilter(commandValue: string, search: string, commandKeywords?: string[]): number {
    // commandValue is the stringified bigint (e.g., "32")
    // We need to find the corresponding label from the options
    const option = StringifiedPermissions.find((opt) => opt.value === commandValue);
    if (!option) return 0;

    const searchLower = search.toLowerCase();
    const labelLower = option.label.toLowerCase();

    // Check if label contains the search term
    if (labelLower.includes(searchLower)) {
      // Return a score based on how early the match appears
      const index = labelLower.indexOf(searchLower);
      return 1 - index / labelLower.length;
    }

    return 0;
  }
</script>

<SiteHeading title="Command Configuration" subtitle="Restrict the usage of the /blacklist command" />

<SaveAlert saving={loading} unsavedChanges={unsaved} saveData={saveChanges} {discardChanges} />

<SettingsGrid class="mt-6">
  {#if commands}
    <!-- Info -->
    <Card.Root class="col-span-full sm:col-span-3">
      <Card.Header>
        <Card.Title>Subcommands</Card.Title>
        <Card.Description>Select the subcommands of /blacklist which you want to configure</Card.Description>
      </Card.Header>
      <Card.Content>
        <Field.Field>
          <Select.Root type="single" bind:value={selectedSubcommandPath}>
            <Select.Trigger class="w-40">
              {Subcommands.find((sub) => sub.value === selectedSubcommandPath)?.label || "Select Subcommand"}
            </Select.Trigger>
            <Select.Content>
              {#each Subcommands as sub (sub.value)}
                <Select.Item value={sub.value}>{sub.label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          <Field.Description>
            If <u>no channels</u>, <u>no roles</u>, <u>no users</u>, and <u>no permissions</u> are set, the
            command will be available to members with the <b>Manage Server</b> permission.
          </Field.Description>
        </Field.Field>
      </Card.Content>
    </Card.Root>

    <!-- Channels (whitelist  model; empty = everywhere) -->
    <Card.Root
      class={cn(
        "col-span-full md:col-span-3",
        !selectedSubcommand && "pointer-events-none opacity-25 select-none",
      )}
    >
      <Card.Header>
        <Card.Title>Whitelisted Channels</Card.Title>
        <Card.Description>
          The channels where the selected subcommands can be used.<br />
          If empty, this restriction is ignored.
        </Card.Description>
        <Card.Content class="p-0">
          {#key selectedSubcommandPath}
            <div class="bg-input/30 border-input max-h-40 w-full overflow-y-auto rounded-md border p-3">
              <div class="flex flex-wrap gap-2" in:fade>
                {#each selectedSubcommand?.channels ?? [] as channel (channel.id)}
                  <Mention channelId={channel.id} onDelete={() => removeFromSelected(channel, "channels")} />
                {/each}
                <Popover.Root>
                  <Popover.Trigger
                    class={buttonVariants({ variant: "outline", size: "icon", class: "size-7" })}
                  >
                    <Plus class="size-4" />
                  </Popover.Trigger>
                  <Popover.Content>
                    <ChannelSelect
                      selectCategories
                      allowCustomChannels
                      excludedChannelIds={selectedSubcommand?.channels.map((c) => c.id) ?? []}
                      onSelect={({ type, id }) =>
                        addIdToSelected(
                          {
                            t:
                              type === ChannelType.GuildCategory
                                ? SpecialChannelType.Category
                                : SpecialChannelType.Channel,
                            id,
                          },
                          "channels",
                        )}
                    />
                  </Popover.Content>
                </Popover.Root>
              </div>
            </div>
          {/key}
        </Card.Content>
      </Card.Header>
    </Card.Root>

    <!-- Roles (whitelisted, empty = ignored) -->
    <Card.Root
      class={cn(
        "col-span-full md:col-span-3",
        !selectedSubcommand && "pointer-events-none opacity-25 select-none",
      )}
    >
      <Card.Header>
        <Card.Title>Whitelisted Roles</Card.Title>
        <Card.Description>
          The roles where the selected subcommands can be used.<br />
          If empty, this restriction is ignored.
        </Card.Description>
        <Card.Content class="p-0">
          {#key selectedSubcommandPath}
            <div class="bg-input/30 border-input max-h-40 w-full overflow-y-auto rounded-md border p-3">
              <div class="flex flex-wrap gap-2" in:fade>
                {#each selectedSubcommand?.roles ?? [] as roleId (roleId)}
                  <Mention {roleId} onDelete={() => removeFromSelected(roleId, "roles")} />
                {/each}
                <Popover.Root>
                  <Popover.Trigger
                    class={buttonVariants({ variant: "outline", size: "icon", class: "size-7" })}
                  >
                    <Plus class="size-4" />
                  </Popover.Trigger>
                  <Popover.Content>
                    <RoleSelect
                      excludedRoleIds={selectedSubcommand?.roles ?? []}
                      onSelect={(rid) => addIdToSelected(rid, "roles")}
                    />
                  </Popover.Content>
                </Popover.Root>
              </div>
            </div>
          {/key}
        </Card.Content>
      </Card.Header>
    </Card.Root>

    <!-- Users (whitelisted, empty = ignored) -->
    <Card.Root
      class={cn(
        "col-span-full md:col-span-3",
        !selectedSubcommand && "pointer-events-none opacity-25 select-none",
      )}
    >
      <Card.Header>
        <Card.Title>Whitelisted Users</Card.Title>
        <Card.Description>
          The users where the selected subcommands can be used.<br />
          If empty, this restriction is ignored.
        </Card.Description>
        <Card.Content class="p-0">
          {#key selectedSubcommandPath}
            <div class="bg-input/30 border-input max-h-40 w-full overflow-y-auto rounded-md border p-3">
              <div class="flex flex-wrap gap-2" in:fade>
                {#each selectedSubcommand?.users ?? [] as userId (userId)}
                  <Mention {userId} onDelete={() => removeFromSelected(userId, "users")} />
                {/each}
                <Popover.Root>
                  <Popover.Trigger
                    class={buttonVariants({ variant: "outline", size: "icon", class: "size-7" })}
                  >
                    <Plus class="size-4" />
                  </Popover.Trigger>
                  <Popover.Content>
                    <UserSelect
                      excludedUserIds={selectedSubcommand?.users ?? []}
                      onSelect={({ id }) => addIdToSelected(id, "users")}
                    />
                  </Popover.Content>
                </Popover.Root>
              </div>
            </div>
          {/key}
        </Card.Content>
      </Card.Header>
    </Card.Root>

    <!-- Permissions (if 0, then default is Manage Server) -->
    <Card.Root
      class={cn(
        "col-span-full md:col-span-3",
        !selectedSubcommand && "pointer-events-none opacity-25 select-none",
      )}
    >
      <Card.Header>
        <Card.Title>Permissions</Card.Title>
        <Card.Description>The permissions needed to use this subcommand.</Card.Description>
        <Card.Content class="p-0">
          {#key selectedSubcommandPath}
            <Combobox
              options={StringifiedPermissions}
              label="Select Permissions"
              selected={selectedPermissions}
              filter={permissionsFilter}
              onSelect={(value) => {
                const current = $state.snapshot(selectedPermissions);
                const idx = current.indexOf(value);
                const newVals =
                  idx === -1 ? [...current, value] : [...current.slice(0, idx), ...current.slice(idx + 1)];
                if (newVals.length === 0) {
                  // Ensure at least Manage Guild is selected
                  newVals.push(PermissionFlagsBits.ManageGuild.toString());
                  toast.warning("At least one permission is required to be set.", {
                    description: "Do you want that nobody uses that command?",
                  });
                }
                updatePermissions(newVals);
              }}
            />
          {/key}
        </Card.Content>
      </Card.Header>
    </Card.Root>
  {:else}
    <div class="col-span-full flex h-48 items-center justify-center">
      <LoadingSpinner />
    </div>
  {/if}
</SettingsGrid>
