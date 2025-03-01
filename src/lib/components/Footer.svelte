<script lang="ts">
  type FooterProps = { year: number | string; additionalClasses?: string };
  let { year, additionalClasses }: FooterProps = $props();
</script>

<footer class="footer-container mt-auto {additionalClasses ? additionalClasses : ''}">
  <nav>
    <p>SupportMail © {year}</p>
  </nav>
  <nav class="">|</nav>
  <nav>
    <a href="/privacy" class="dy-link dy-link-hover">Privacy Policy</a>
  </nav>
  <nav>|</nav>
  <nav>
    <a href="/terms" class="dy-link dy-link-hover">Terms of Service</a>
  </nav>
</footer>
