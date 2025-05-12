<script lang="ts">
  import { page } from "$app/state";
  import { ImportantLinks } from "$lib/urls";
</script>

<footer class="footer-container" class:ml-0={page.url.pathname === "/" || page.url.pathname === "/@me"}>
  <a href={ImportantLinks.legal.notice} target="_blank">SupportMail © {page.data.ccDate}</a>
  <a href={ImportantLinks.legal.terms} target="_blank">Terms of Service</a>
  <a href={ImportantLinks.legal.privacy} target="_blank">Privacy Policy</a>
</footer>
