<script lang="ts">
  import { ImportantLinks } from "$lib/constants";

  type FooterProps = { year: number | string };
  let { year }: FooterProps = $props();
</script>

<footer class="footer-container">
  <nav>
    <a href={ImportantLinks.legal.notice} target="_blank">SupportMail © {year}</a>
  </nav>
  <nav>|</nav>
  <nav>
    <a href={ImportantLinks.legal.terms} target="_blank">Terms of Service</a>
  </nav>
  <nav>|</nav>
  <nav>
    <a href={ImportantLinks.legal.privacy} target="_blank">Privacy Policy</a>
  </nav>
</footer>
