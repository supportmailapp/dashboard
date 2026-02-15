<script lang="ts">
  import Plus from "@lucide/svelte/icons/plus";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import * as Card from "$ui/card/index.js";
  import * as Field from "$ui/field/index.js";
  import * as Popover from "$ui/popover/index.js";
  import SettingsGrid from "$lib/components/SettingsGrid.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import { SpecialChannelType, type APICommandConfig } from "$lib/sm-types";
  import { cn, determineUnsavedChanges } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { APIRoutes } from "$lib/urls";
  import { page } from "$app/state";
  import { afterNavigate } from "$app/navigation";
  import Mention from "$lib/components/discord/Mention.svelte";
  import RoleSelect from "$lib/components/discord/RoleSelect.svelte";
  import UserSelect from "$lib/components/discord/UserSelect.svelte";
  import ChannelSelect from "$lib/components/discord/ChannelSelect.svelte";
  import { buttonVariants } from "$ui/button";
  import { ChannelType } from "discord-api-types/v10";
  import { fade } from "svelte/transition";
  import { GetPermissionsArray, PermissionFlagsBits } from "$lib/utils/permissions.js";
  import Combobox from "$ui/combobox/Combobox.svelte";
  import { BitField } from "$lib/utils/bitfields";
  import { toast } from "svelte-sonner";
  import Button from "$ui/button/button.svelte";
  import AreYouSureDialog from "$lib/components/AreYouSureDialog.svelte";

  const Subcommands = [
    { label: "/blacklist add", value: "blacklist/add" },
    { label: "/blacklist remove", value: "blacklist/remove" },
    { label: "/blacklist view", value: "blacklist/view" },
    { label: "/blacklist clear", value: "blacklist/clear" },
    { label: "/blacklist check", value: "blacklist/check" },
  ];
  const DefaultSubcommandConfig = Subcommands.map((sub) => sub.value).reduce(
    (acc, path) => {
      acc[path] = {
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
  const StringifiedPermissions = GetPermissionsArray(true);

  let oldCommands: Record<string, APICommandConfig> | null = null;
  let commands = $state<Record<string, APICommandConfig> | null>(null);
  let loading = $state(true);
  let unsaved = $derived(determineUnsavedChanges(oldCommands, $state.snapshot(commands)));
  let resetDialogOpen = $state(false);

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
      APIRoutes.commandConfig(page.params.guildid!, { path: "blacklist" }),
    );

    selectedSubcommandPath = "";
    if (res.ok) {
      const jsonData = await res.json();
      commands = jsonData.reduce(
        (acc, cmd) => {
          acc[cmd.commandPath] = cmd;
          return acc;
        },
        { ...DefaultSubcommandConfig },
      );
      oldCommands = $state.snapshot(commands);
    } else if (res.status === 404) {
      // Mock data
      commands = { ...DefaultSubcommandConfig };
      oldCommands = { ...DefaultSubcommandConfig };
    } else {
      commands = null;
      oldCommands = null;
    }
  }

  async function saveChanges() {
    if (!commands) return;
    loading = true;

    const res = await apiClient.put<APICommandConfig[]>(APIRoutes.commandConfig(page.params.guildid!), {
      json: Object.values($state.snapshot(commands)),
    });

    if (res.ok) {
      const jsonres = await res.json();
      commands = jsonres.reduce(
        (acc, cmd) => {
          acc[cmd.commandPath] = cmd;
          return acc;
        },
        { ...DefaultSubcommandConfig },
      );
      oldCommands = $state.snapshot(commands);
      toast.success("Command configuration saved successfully.");
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

  async function reset() {
    if (!page.params.guildid) return;
    loading = true;
    const res = await apiClient.delete(APIRoutes.commandConfig(page.params.guildid, { path: "blacklist" }));
    if (res.ok) {
      toast.success("Command configuration has been reset to default.");
    } else {
      toast.error("Failed to reset command configuration.");
    }
    location.reload();
  }
</script>

<SiteHeading title="Command Configuration" subtitle="Restrict the usage of the /blacklist command" />

<SaveAlert saving={loading} unsavedChanges={unsaved} saveData={saveChanges} {discardChanges} />

<!-- Info -->
<Card.Root class="col-span-full sm:col-span-4">
  <Card.Header>
    <Card.Title>Subcommands</Card.Title>
    <Card.Description>Select the subcommands of /blacklist which you want to configure</Card.Description>
  </Card.Header>
  <Card.Content>
    <Field.Field>
      <div class="w-full max-w-xl">
        <Combobox
          closeOnSelect={true}
          single={true}
          options={Subcommands}
          selected={selectedSubcommandPath ? [selectedSubcommandPath] : []}
          onSelect={(value) => {
            selectedSubcommandPath = value;
          }}
          label={Subcommands.find((sub) => sub.value === selectedSubcommandPath)?.label ||
            "Select Subcommand"}
          commandItemClass="w-full max-w-xl"
        />
      </div>
      <Field.Description>
        If <u>no channels</u>, <u>no roles</u>, <u>no users</u>, and <u>no permissions</u> are set, the
        command will be available to members with the <b>Manage Server</b> permission.
      </Field.Description>
    </Field.Field>
  </Card.Content>
</Card.Root>

<SettingsGrid class="mt-6">
  {#if commands}
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
          <span class:text-warning={!selectedSubcommand?.channels.length}
            >If empty, this restriction is ignored.</span
          >
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
                      channelTypes={[
                        ChannelType.GuildText,
                        ChannelType.GuildAnnouncement,
                        ChannelType.GuildForum,
                        ChannelType.GuildCategory,
                        ChannelType.PublicThread,
                        ChannelType.GuildVoice,
                        ChannelType.GuildStageVoice,
                      ]}
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

    <Card.Root destructive class="col-span-full">
      <Card.Header>
        <Card.Title>Danger Zone</Card.Title>
      </Card.Header>
      <Card.Content>
        <Button variant="destructive" onclick={() => (resetDialogOpen = true)}>Reset Configuration</Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="col-span-full flex h-48 items-center justify-center">
      <LoadingSpinner />
    </div>
  {/if}
</SettingsGrid>

<AreYouSureDialog
  bind:open={resetDialogOpen}
  title="Reset Command Configuration"
  description="This will reset all command configurations to their default settings. Are you sure you want to proceed?"
  onYes={reset}
/>
