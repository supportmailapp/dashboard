<script lang="ts">
  import { goto, invalidate } from "$app/navigation";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import { Button } from "$ui/button";
  import { Input } from "$ui/input";
  import Search from "@lucide/svelte/icons/search";
  import SnippetModal from "./snippet-modal/SnippetModal.svelte";
  import Plus from "@lucide/svelte/icons/plus";
  import { ReactiveSnippet } from "./snippetClass.svelte";
  import { page } from "$app/state";
  import apiClient from "$lib/utils/apiClient";
  import { APIRoutes } from "$lib/urls";
  import type { APISnippet } from "../../../api/v1/guilds/[guildid]/snippets/+server";

  let { data } = $props();

  $inspect("snippets", data.snippets);

  let searchInput = $state("");
  const newSnippetStates = $state({
    modalOpen: false,
    loading: false,
  });
  const selectedSnippetStates = $state({
    modalOpen: false,
    loading: false,
  });
  const newSnippet = new ReactiveSnippet();
  const selectedSnippet = new ReactiveSnippet();
  let snippetModalMode = $state<"create" | "edit">("create");

  async function fetchNewSnippets() {
    console.log("Fetching new snippets...");
    goto(page.url.pathname + (searchInput !== "" ? `?search=${$state.snapshot(searchInput)}` : ""), {
      replaceState: true,
    });
  }

  async function saveSnippet(_data: { name: string; content: string; _id?: string }) {
    try {
      const res = await apiClient.put(APIRoutes.snippets(page.data.guildId!), {
        json: _data,
      });

      if (res.ok) {
        const json = await res.json<APISnippet>();
        if (_data._id) {
          data.snippets = data.snippets.map((s) => (s._id === _data._id ? json : s));
        } else {
          data.snippets = [...data.snippets, json];
        }
      }
    } catch (err) {
      console.error("Error saving snippet:", err);
    }
  }
</script>

<SiteHeading title="Custom Messages" subtitle="Manage your custom messages" />

<div class="mb-4 flex flex-col items-start justify-start gap-3">
  <div class="bg-card flex w-full max-w-2xl flex-wrap gap-3 rounded-lg border p-4">
    <div class="flex w-full max-w-xs flex-row gap-2">
      <Input placeholder="Search for tags by name" class="flex-1" bind:value={searchInput} />
      <Button variant="default" size="icon" onclick={fetchNewSnippets}><Search /></Button>
    </div>
  </div>

  <div class="flex w-full max-w-2xl justify-start gap-3">
    <Button variant="default" onclick={() => (newSnippetStates.modalOpen = true)}>
      <Plus class="size-5" />
      New
    </Button>
  </div>

  <SnippetModal
    bind:open={
      () => (snippetModalMode === "create" ? newSnippetStates.modalOpen : selectedSnippetStates.modalOpen),
      (v) => {
        if (snippetModalMode === "create") {
          newSnippetStates.modalOpen = v;
        } else {
          selectedSnippetStates.modalOpen = v;
        }
      }
    }
    bind:name={
      () => (snippetModalMode === "create" ? newSnippet.name : selectedSnippet.name),
      (v) => {
        if (snippetModalMode === "create") {
          newSnippet.name = v;
        } else {
          selectedSnippet.name = v;
        }
      }
    }
    bind:content={
      () => (snippetModalMode === "create" ? newSnippet.content : selectedSnippet.content),
      (v) => {
        if (snippetModalMode === "create") {
          newSnippet.content = v;
        } else {
          selectedSnippet.content = v;
        }
      }
    }
    bind:loading={
      () => (snippetModalMode === "create" ? newSnippetStates.loading : selectedSnippetStates.loading),
      (v) => {
        if (snippetModalMode === "create") {
          newSnippetStates.loading = v;
        } else {
          selectedSnippetStates.loading = v;
        }
      }
    }
    onSave={async () => {
      const snippetData = {
        name: snippetModalMode === "create" ? newSnippet.name : selectedSnippet.name,
        content: snippetModalMode === "create" ? newSnippet.content : selectedSnippet.content,
        _id: snippetModalMode === "create" ? newSnippet._id : selectedSnippet._id,
      };
      if (snippetModalMode === "create") {
        newSnippetStates.loading = true;
        await saveSnippet(snippetData);
        newSnippetStates.loading = false;
      } else {
        selectedSnippetStates.loading = true;
        await saveSnippet(snippetData);
        selectedSnippetStates.loading = false;
      }
    }}
  />
</div>
