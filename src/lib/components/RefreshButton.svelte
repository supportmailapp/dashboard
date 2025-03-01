<script lang="ts">
  import type { MouseEventHandler } from "svelte/elements";

  const defaultClickFunc = () => {
    window.location.assign(whatInvalidate);
  };

  type Props = {
    /**
     * The text to display on the button.
     */
    text: string;
    /**
     * The path to invalidate.
     */
    whatInvalidate?: string | URL;
    /**
     * The function to run when the button is clicked. Only use this if you need to run a function instead of navigating.
     */
    clickFunction?: MouseEventHandler<HTMLButtonElement>;
  };
  let { text, whatInvalidate = "/", clickFunction = defaultClickFunc }: Props = $props();
</script>

<button class="dy-btn dy-btn-sm dy-btn-soft flex justify-between gap-x-2 border-2 px-2" onclick={clickFunction}>
  <img src="/arrow-update.svg" alt="Refresh" class="block size-4" />
  {text}
</button>
