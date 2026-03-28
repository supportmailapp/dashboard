<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import ContentEditorDialog from "$lib/components/ContentEditorDialog.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import { APIRoutes } from "$lib/urls.svelte";
  import { determineUnsavedChanges } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import Button from "$ui/button/button.svelte";
  import * as Empty from "$ui/empty/index.js";
  import * as InputGroup from "$ui/input-group/index.js";
  import Input from "$ui/input/input.svelte";
  import * as Item from "$ui/item/index.js";
  import type { APITag, TagsResponse } from "$v1Api/guilds/[guildid=snowflake]/tags/+server";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import SearchIcon from "@lucide/svelte/icons/search";
  import Trash from "@lucide/svelte/icons/trash";
  import { toast } from "svelte-sonner";
  import { fly } from "svelte/transition";

  // svelte-ignore non_reactive_update
  let fetchedTags: TagsResponse | null = null;
  let loading = $state(true);
  let tags = $state<TagsResponse | null>(null);
  let unsavedChanges = $derived(determineUnsavedChanges(fetchedTags, tags));
  const editTag = $state({
    data: null as APITag | null,
    open: false,
    activeTab: "editor" as "editor" | "preview",
  });

  let query = $state("");
  let filteredTags = $derived(
    tags
      ? tags.filter(
          (tag) =>
            !tag.delete &&
            (tag.name.toLowerCase().includes(query.toLowerCase()) ||
              (tag.content?.toLowerCase() ?? "").includes(query.toLowerCase())),
        )
      : null,
  );

  let editorTitle = $derived(editTag.data?.name ? `Edit ${editTag.data.name}` : "Edit Tag");

  function createTag() {
    if (!tags) return;
    let newNameIndex = 1;
    while (tags.some((t) => t.name === `new-tag-${newNameIndex}`)) {
      newNameIndex++;
    }
    const newTagName = `new-tag-${newNameIndex}`;
    const newTagId = new Date().toISOString();
    const newTag = {
      _id: newTagId, // temp unique id
      local: true,
      guildId: page.params.guildid!,
      name: newTagName,
      content: "",
      onlyTickets: false,
      createdAt: new Date().toISOString(),
    } as APITag;

    tags = [...tags, newTag].sort((a, b) => a.createdAt!.localeCompare(b.createdAt!)) as TagsResponse;

    const addedTag = tags.find((t) => t._id === newTagId);
    if (addedTag) {
      editTag.data = addedTag;
      editTag.open = true;
    }
  }

  function findTagIndex(id: string) {
    if (!tags) return null;
    const index = tags.findIndex((t) => t._id === id);
    return index === -1 ? null : index;
  }

  function removeTagById(id: string) {
    if (!tags) return;
    const tagIndex = findTagIndex(id);
    if (tagIndex !== null) tags[tagIndex].delete = true;
  }

  function updateTagById(id: string, updatedTag: Partial<APITag>) {
    if (!tags) return;
    const tagIndex = findTagIndex(id);
    if (tagIndex !== null) tags[tagIndex] = { ...tags[tagIndex], ...updatedTag };
  }

  async function fetchTags() {
    loading = true;
    const res = await apiClient.get<APITag[]>(APIRoutes.tags());

    if (res.ok) {
      tags = res.data;
      fetchedTags = JSON.parse(JSON.stringify(res.data));
    } else {
      tags = null;
      fetchedTags = null;
      toast.error("Failed to fetch tags");
    }
  }

  async function saveTags() {
    if (!tags) return;
    loading = true;

    const res = await apiClient.put<APITag[]>(APIRoutes.tags(), {
      json: $state.snapshot(tags),
    });

    if (!res.ok) {
      toast.error("Failed to save tags", { description: res.error });
    } else {
      fetchedTags = [...res.data];
      tags = [...res.data];
      toast.success("Tags saved!");
    }
    loading = false;
  }

  function discardChanges() {
    if (!fetchedTags) return;
    tags = [...fetchedTags];
  }

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
        {#each filteredTags as tag (tag._id)}
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

<ContentEditorDialog
  bind:open={
    () => editTag.open,
    (v) => {
      editTag.open = v;
    }
  }
  onOpenChangeComplete={(open) => {
    if (!open) {
      editTag.data = null;
    }
  }}
  title={editorTitle}
  bind:activeTab={editTag.activeTab}
  bind:rawText={
    () => editTag.data?.content ?? "",
    (v) => {
      if (editTag.data) editTag.data.content = v;
    }
  }
  onRawTextChange={(v) => {
    if (editTag.data?._id) updateTagById(editTag.data._id, { content: v });
  }}
/>
