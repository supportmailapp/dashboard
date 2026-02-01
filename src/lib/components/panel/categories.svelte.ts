import { page } from "$app/state";
import { APIRoutes } from "$lib/urls";
import apiClient from "$lib/utils/apiClient";
import { createContext } from "svelte";
import { SvelteMap } from "svelte/reactivity";

class CategoriesManager {
  private _loaded = $state(false);
  readonly cats = new SvelteMap<string, string>();

  constructor() {}

  public get loaded() {
    return this._loaded;
  }

  async fetchCats() {
    if (this.cats.size === 0) {
      const res = await apiClient.get<{ _id: string; label: string }[]>(
        APIRoutes.ticketCategories(page.params.guildid!, true),
      );
      if (res.ok) {
        const data = await res.json();
        data.forEach((tag) => {
          this.cats.set(tag._id, tag.label);
        });
        this._loaded = true;
      }
    }
  }
}

const [get, set] = createContext<CategoriesManager>();

const setCategoriesManager = () => {
  set(new CategoriesManager());
};

export { get as getCategoriesManager, setCategoriesManager };
