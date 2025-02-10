import { page } from "$app/state";

export function showServerSelect() {
  const dialog = document.getElementById("server-select") as HTMLDialogElement;
  dialog.showModal();
}

/**
 *
 * @param slug The slug of the page to navigate to - has to start with a slash!
 */
export function buildNavHref(slug: string = "/"): string {
  return `/${page.params.slug + slug}`.replace(/\/$/, "");
}
