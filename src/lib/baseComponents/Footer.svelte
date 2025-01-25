<script lang="ts">
  type FooterProps = { year: number };
  let { year }: FooterProps = $props();
</script>

<footer class="text-base-content xy-center-items grid w-full grid-flow-col gap-x-5 border-t-2 bg-transparent p-4 md:gap-x-15">
  <nav>
    <p>SupportMail © {year}</p>
  </nav>
  <nav>
    <a href="/privacy" class="dy-link dy-link-hover">Privacy Policy</a>
  </nav>
  <nav>
    <a href="/terms" class="dy-link dy-link-hover">Terms of Service</a>
  </nav>
</footer>
