<script lang="ts" module>
  export type ConfigKey =
    | "guild"
    | "blacklist"
    | "commandConfig"
    | "feedback"
    | "panel"
    | "tags"
    | "ticketCategories";

  const availableConfigs = [
    { value: "guild", name: "Guild" },
    { value: "blacklist", name: "Blacklist" },
    { value: "commandConfig", name: "Command Config" },
    { value: "feedback", name: "Feedback" },
    { value: "panel", name: "Panel" },
    { value: "tags", name: "Tags" },
    { value: "ticketCategories", name: "Ticket Categories" },
  ] as const;

  export const searchParamsSchema = z.object({
    selected: z._default(
      z.array(
        z.enum(["guild", "blacklist", "commandConfig", "feedback", "panel", "tags", "ticketCategories"]),
      ),
      [],
    ),
    guild: z._default(z.string(), ""),
  });
</script>

<script lang="ts">
  import * as z from "zod/mini";
  import { useSearchParams } from "runed/kit";

  import * as Field from "$ui/field/index.js";
  import * as Select from "$ui/select/index.js";
  import * as Card from "$ui/card/index.js";
  import Input from "$ui/input/input.svelte";
  import Button from "$ui/button/button.svelte";
  import { getBreadcrumbs } from "../breadcrumb.svelte";
  import { onDestroy, onMount } from "svelte";
  import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";

  let { data } = $props();

  // Initialize reactive search params
  const params = useSearchParams(searchParamsSchema, {
    debounce: 800,
    pushHistory: true,
  });

  let configData = $derived(data.configs);

  const crumbs = getBreadcrumbs();
  onMount(() => {
    crumbs.set({ label: "Configuration", href: "/config" });
  });
  onDestroy(() => {
    crumbs.pop();
  });

  function base64Encode(obj: any) {
    try {
      const json = JSON.stringify(obj ?? {});
      // handle unicode safely
      return btoa(unescape(encodeURIComponent(json)));
    } catch (e) {
      return "";
    }
  }

  function truncate(str: string, n = 120) {
    if (!str) return "";
    return str.length > n ? str.slice(0, n) + "…" : str;
  }

  function previewJSON(obj: any) {
    try {
      return JSON.stringify(obj, null, 0);
    } catch (e) {
      return String(obj);
    }
  }
</script>

<Field.Group class="grid w-full max-w-3xl grid-cols-1 gap-4 lg:grid-cols-2">
  <Field.Field>
    <Field.Label>Server ID</Field.Label>
    <Input
      type="text"
      placeholder="Enter Guild ID"
      bind:value={
        () => params.guild,
        (v) => {
          console.log("Updated guild ID:", params.guild, "->", v);
          params.guild = v;
          configData = {};
        }
      }
      class="text-sm"
    />
  </Field.Field>
  <Field.Field orientation="vertical">
    <Field.Label>Configuration</Field.Label>
    <Select.Root type="multiple" bind:value={() => params.selected, (v) => (params.selected = v)}>
      <Select.Trigger>Select Configs for the server</Select.Trigger>
      <Select.Content>
        {#each availableConfigs as config}
          <Select.Item value={config.value}>{config.name}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </Field.Field>
</Field.Group>

<!-- Compact previews for returned configs -->
{#if configData && Object.keys(configData || {}).length}
  <div class="mt-6 grid w-full max-w-4xl gap-3">
    {#each Object.keys(configData) as _key}
      {@const key = _key as ConfigKey}
      <Card.Root>
        <Card.Header>
          <Card.Title class="font-semibold">{key}</Card.Title>
          <Card.Action>
            <Button
              variant="ghost"
              size="sm"
              href="/mod/config/view#{base64Encode(configData[key])}"
              target="_blank"
            >
              View JSON
              <ArrowUpRight />
            </Button>
          </Card.Action>
        </Card.Header>
        <Card.Content>
          {#if Array.isArray(configData[key])}
            {configData[key as ConfigKey].length} items — {truncate(previewJSON(configData[key][0]))}
          {:else}
            {truncate(previewJSON(configData[key]))}
          {/if}
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
{/if}
