import { site } from "$lib/stores/site.svelte";

export async function userSaveFunction(event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  event.preventDefault();
  site.saving = true;
  const form = event.currentTarget;
  const formData = new FormData(form);
  console.log("formData", formData);
}
