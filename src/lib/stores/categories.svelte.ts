import { toast } from "svelte-sonner";
import apiClient from "../utils/apiClient.js";
import { SvelteMap } from "svelte/reactivity";
import { computeCommandScore } from "bits-ui";
import { createContext } from "svelte";
import { APIRoutes } from "$lib/urls.svelte.js";

export class CategoriesManager {
  cats = new SvelteMap<string, PartialCategory>();
  private _loaded = $state(false);

  /**
   * Whether shit's loaded.
   */
  get loaded() {
    return this._loaded;
  }

  async fetch(partial = false) {
    const res = await apiClient.get<PartialCategory[]>(APIRoutes.ticketCategories(partial));

    if (res.ok) {
      res.data.forEach((cat) => {
        this.cats.set(cat._id!, cat);
      });
      this._loaded = true;
    } else {
      console.error("Failed to fetch categories:", res);
      toast.error("Failed to fetch categories.", { description: res.error });
    }
  }

  /**
   * Filter function for a command component.
   */
  filter(id: string, search: string, commandKeywords?: string[]): number {
    if (!this.cats.size) return 0;

    const cat = this.cats.get(id);
    if (!cat) return 0;
    if (cat.label.toLowerCase() === id) return 1;

    return computeCommandScore(cat.label, search, commandKeywords);
  }

  clear() {
    this.cats.clear();
    this._loaded = false;
  }
}

const [get, set] = createContext<CategoriesManager>();

export function initCategoriesManager() {
  return set(new CategoriesManager());
}

export { get as getCategoriesManager };
