<script lang="ts">
  import { page } from "$app/state";
  import { ImportantLinks } from "$lib/urls";
</script>

<footer class="footer-container" class:server-select={page.url.pathname === "/"}>
  <a href={ImportantLinks.legal.notice} target="_blank">SupportMail © {page.data.ccDate}</a>
  <a href={ImportantLinks.legal.terms} target="_blank">Terms of Service</a>
  <a href={ImportantLinks.legal.privacy} target="_blank">Privacy Policy</a>
</footer>
