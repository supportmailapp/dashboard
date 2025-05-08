<script lang="ts">
  import { cdnUrls } from "$lib/utils/formatting";

  let { name, id, size = 7 } = $props();
</script>

<div class="dy-avatar {'size-' + size}">
  <img src={cdnUrls.guildEmoji(id, 64)} alt={name} style="aspect-ratio: 1 / 1" />
</div>
