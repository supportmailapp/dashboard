<script lang="ts">
  import { page } from "$app/state";
  import { ImportantLinks } from "$lib/constants";
</script>

<footer class="footer-container">
  <nav>
    <a href={ImportantLinks.legal.notice} target="_blank">SupportMail © {page.data.ccDate}</a>
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
