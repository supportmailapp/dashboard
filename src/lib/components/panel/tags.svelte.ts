import { page } from "$app/state";
import { APIRoutes } from "$lib/urls";
import apiClient from "$lib/utils/apiClient";
import { createContext } from "svelte";
import { SvelteMap } from "svelte/reactivity";

class TagsManager {
  private _loaded = $state(false);
  readonly tags = new SvelteMap<string, string>();

  constructor() {}

  public get loaded() {
    return this._loaded;
  }

  async fetchTags() {
    if (this.tags.size === 0) {
      const res = await apiClient.get<{ _id: string; name: string }[]>(
        APIRoutes.tags(/* page.params.guildid! */ "1114825999155200101", true),
      );
      if (res.ok) {
        const data = await res.json();
        data.forEach((tag) => {
          this.tags.set(tag._id, tag.name);
        });
        this._loaded = true;
      }
    }
  }
}

const [get, set] = createContext<TagsManager>();

const setTagsManager = () => {
  set(new TagsManager());
};

export { get as getTagsManager, setTagsManager };
