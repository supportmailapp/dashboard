<script lang="ts">
  import Textarea from "$ui/textarea/textarea.svelte";
  import RemoveButtonWrapper from "./RemoveButtonWrapper.svelte";

  type Props = ComponentWithRemoveHandler<{
    content: string;
  }>;

  let { content = $bindable(""), onRemove }: Props = $props();
</script>

<RemoveButtonWrapper {onRemove}>
  <Textarea
    bind:value={content}
    rows={1}
    class="dark:hover:bg-input/30 field-sizing-content min-h-9.5 resize-none overflow-y-hidden rounded dark:bg-transparent"
  ></Textarea>
</RemoveButtonWrapper>
