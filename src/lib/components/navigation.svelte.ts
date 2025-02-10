import { page } from "$app/state";

export function showServerSelect() {
  const dialog = document.getElementById("server-select") as HTMLDialogElement;
  dialog.showModal();
}

export function buildNavHref(slug: string = "/") {
  return `/${page.params.slug + slug}`.replace(/\/+$/, "");
}
