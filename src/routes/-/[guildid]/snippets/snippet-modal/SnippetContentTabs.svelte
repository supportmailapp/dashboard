<script lang="ts">
  import "$lib/assets/markup.css";
  import { MarkupParser } from "$lib/utils/markup";
  import * as Tabs from "$ui/tabs/index.js";
  import { Textarea } from "$ui/textarea";

  let { content = $bindable("") } = $props();
  let parsedContent = $derived(new MarkupParser().parse(content));
</script>

<Tabs.Root
  value="edit"
  class="h-full w-full"
  onValueChange={() => (parsedContent = new MarkupParser().parse(content))}
>
  <Tabs.List class="w-full">
    <Tabs.Trigger value="edit">Edit</Tabs.Trigger>
    <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="edit">
    <Textarea
      placeholder="Enter snippet content | Discord Markdown supported"
      class="h-full w-full resize-none text-[0.9rem]"
      bind:value={content}
    />
  </Tabs.Content>
  <Tabs.Content value="preview" class="overflow-y-auto">
    <div class="markup h-full w-full overflow-y-auto">{@html parsedContent}</div>
  </Tabs.Content>
</Tabs.Root>
