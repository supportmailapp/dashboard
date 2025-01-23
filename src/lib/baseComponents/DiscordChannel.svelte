<script lang="ts">
  export type ChannelProps = {
    name: string;
  };

  let { name }: ChannelProps = $props();
</script>

<div class="discord-channel">
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="m-0.5 size-4">
    <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
  </svg>
  <span>{name}</span>
</div>
