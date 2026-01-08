<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import ContentEditor from "$lib/components/ContentEditor.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import { APIRoutes } from "$lib/urls";
  import { determineUnsavedChanges } from "$lib/utils";
  import type { APITag } from "$v1Api/guilds/[guildid]/tags/+server";
  import { page } from "$app/state";
  import { toast } from "svelte-sonner";
  import apiClient from "$lib/utils/apiClient";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { fly } from "svelte/transition";
  import SearchIcon from "@lucide/svelte/icons/search";
  import * as InputGroup from "$ui/input-group/index.js";
  import * as Dialog from "$ui/dialog/index.js";
  import * as Empty from "$ui/empty/index.js";
  import * as Item from "$ui/item/index.js";
  import Button from "$ui/button/button.svelte";
  import Plus from "@lucide/svelte/icons/plus";
  import Input from "$ui/input/input.svelte";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Trash from "@lucide/svelte/icons/trash";

  // svelte-ignore non_reactive_update
  let fetchedTags: APITag[] | null = null;
  let loading = $state(true);
  let tags = $state<APITag[] | null>(null);
  let unsavedChanges = $derived(determineUnsavedChanges(fetchedTags, tags));
  const editTag = $state({
    data: null as APITag | null,
    open: false,
  });

  let query = $state("");
  let filteredTags = $derived(
    tags
      ? tags.filter(
          (tag) =>
            tag.name.toLowerCase().includes(query.toLowerCase()) ||
            tag.content.toLowerCase().includes(query.toLowerCase()),
        )
      : null,
  );

  function createTag() {
    if (!tags) return;
    tags = [
      ...tags,
      {
        _id: new Date().toISOString(), // temp unique id
        local: true,
        guildId: page.params.guildid!,
        name: "new-tag",
        content: "",
        onlyTickets: false,
      },
    ];
  }

  function removeTagById(id: string) {
    if (!tags) return;
    tags = tags.filter((t) => t._id !== id);
  }

  function updateTagById(id: string, updatedTag: Partial<APITag>) {
    if (!tags) return;
    const tagIndex = tags.findIndex((t) => t._id === id);
    if (tagIndex === -1) return;
    tags[tagIndex] = { ...tags[tagIndex], ...updatedTag };
  }

  async function fetchTags() {
    loading = true;
    const res = await apiClient.get<APITag[]>(APIRoutes.tags(page.params.guildid!));

    const jsonRes = await res.json();
    if (res.ok) {
      tags = jsonRes;
      fetchedTags = JSON.parse(JSON.stringify(jsonRes));
    } else {
      tags = null;
      fetchedTags = null;
      toast.error("Failed to fetch tags");
    }
  }

  async function saveTags() {
    if (!tags) return;
    loading = true;

    const res = await apiClient.put<APITag[]>(APIRoutes.tags(page.params.guildid!), {
      json: $state.snapshot(tags),
    });

    const jsonRes = await res.json();
    if (!res.ok) {
      toast.error(`Failed to save tags: ${(jsonRes as any).message ?? res.statusText}`);
    } else {
      fetchedTags = JSON.parse(JSON.stringify(jsonRes));
      tags = jsonRes;
      toast.success("Tags saved!");
    }
    loading = false;
  }

  function discardChanges() {
    if (!fetchedTags) return;
    tags = [...fetchedTags];
  }

  // onMount(async () => {
  //   if (Array.isArray(tags)) return;
  //   await fetchTags();
  //   loading = false;
  // });

  // onDestroy(() => {
  //   tags = null;
  //   fetchedTags = null;
  // });

  afterNavigate(async () => {
    tags = null;
    fetchedTags = null;
    await fetchTags();
    loading = false;
  });
</script>

<SaveAlert saving={loading} saveData={saveTags} {discardChanges} {unsavedChanges} />

{#if Array.isArray(tags)}
  <div class="block w-full max-w-5xl space-y-6">
    <!-- Search -->
    <div in:fly={{ y: 20, duration: 200 }} class="flex w-full flex-col gap-2 md:flex-row md:items-center">
      <InputGroup.Root>
        <InputGroup.Input bind:value={query} placeholder="Search tags..." class="flex-1" />
        <InputGroup.Addon>
          <SearchIcon />
        </InputGroup.Addon>
        <InputGroup.Addon align="inline-end"
          >{filteredTags ? filteredTags.length : 0} results</InputGroup.Addon
        >
      </InputGroup.Root>
      <Button variant="default" onclick={createTag}>
        <Plus class="size-4" />
        Add Tag
      </Button>
    </div>

    <!-- List -->
    <div class="flex w-full flex-col gap-3">
      {#if fetchedTags && fetchedTags.length === 0 && (!filteredTags || filteredTags.length === 0)}
        <Empty.Root>
          <Empty.Header>
            <Empty.Media variant="icon">
              <FolderOpen class="size-7" />
            </Empty.Media>
            <Empty.Title>No data</Empty.Title>
            <Empty.Description>No data found</Empty.Description>
          </Empty.Header>
          <Empty.Content>
            <Button onclick={createTag}>Create Tag</Button>
          </Empty.Content>
        </Empty.Root>
      {/if}
      {#if filteredTags && filteredTags.length > 0}
        {#each filteredTags as tag, index (tag.name)}
          <Item.Root variant="outline" class="w-full">
            <Item.Content>
              <Input
                bind:value={
                  () => tag.name,
                  (v) => {
                    updateTagById(tag._id!, { name: v });
                  }
                }
                class="font-monospace font-sm w-full max-w-md"
                maxlength={50}
                minlength={2}
                placeholder="Unqiue Tag Name"
              />
            </Item.Content>
            <Item.Actions>
              <Button
                variant="default"
                size="lg"
                onclick={() => {
                  editTag.data = tag;
                  editTag.open = true;
                }}
              >
                <Pencil class="size-5" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="icon-lg"
                onclick={() => {
                  removeTagById(tag._id!);
                }}
              >
                <Trash class="size-5" />
              </Button>
            </Item.Actions>
          </Item.Root>
        {/each}
      {:else if fetchedTags?.length && filteredTags && filteredTags.length === 0}
        <div class="grid place-items-center p-10">
          <p class="text-muted-foreground text-sm">No tags found.</p>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="grid place-items-center">
    <LoadingSpinner />
  </div>
{/if}

<Dialog.Root
  bind:open={
    () => editTag.open,
    (v) => {
      editTag.open = v;
      if (!v) {
        editTag.data = null;
      }
    }
  }
>
  <Dialog.Content
    class="h-screen w-screen max-w-screen grid-rows-[auto_1fr] sm:max-h-[calc(100%-2rem)] sm:max-w-[calc(100%-2rem)]"
  >
    <Dialog.Header class="h-fit">
      <Dialog.Title>
        Edit <span class="monospace">{editTag.data?.name}</span>
      </Dialog.Title>
    </Dialog.Header>
    <div class="flex h-full w-full flex-1 overflow-y-auto">
      <ContentEditor
        class="h-full flex-1"
        bind:rawText={
          () => editTag.data?.content ?? "",
          (v) => {
            if (editTag.data) editTag.data.content = v;
          }
        }
      />
    </div>
  </Dialog.Content>
</Dialog.Root>
