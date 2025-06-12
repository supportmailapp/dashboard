import { BasicFetchInit } from "$lib/constants";
import { APIRoutes } from "$lib/urls";

export class DataManager {
  /**
   * The old data, used to restore the data if the user cancels.
   *
   * @type {unknown | null}
   */
  oldConfig = null;
  unsaved = $state(false);
  /**
   * The percentage of the save progress.
   *
   * 0 = not started
   * 100 = completed
   */
  saveProgress = $state(0);
  /**
   * Indicates if the data is currently being saved.
   *
   * @readonly
   */
  saving = $derived(this.saveProgress > 0 && this.saveProgress < 100); // Can't be manipulated directly
  #save = () => console.warn("No save function set");
  #reset = () => console.warn("No cancel function set");
  /**
   * The filtered guilds that where the user has at least managar permissions.
   *
   * @type {BotGuild[]}
   */
  guilds = $state([]);

  constructor(initialVal = false) {
    this.unsaved = initialVal;
  }

  set revert(fn) {
    this.#reset = () => {
      fn();
      this.unsaved = false;
      this.saveProgress = 0;
    };
  }

  /**
   * The cancel function to be called when the user cancels the save.
   *
   * @memberof DataState
   */
  get revert() {
    return this.#reset;
  }

  set save(fn) {
    this.#save = () => {
      this.saveProgress = 1;
      fn();
    };
  }

  /**
   * The save function to be called when the user saves the data.
   *
   * @memberof DataState
   */
  get save() {
    return this.#save;
  }

  async loadGuilds() {
    const guildsRes = await fetch(APIRoutes.userGuilds(true), BasicFetchInit("GET"));

    if (guildsRes.ok) {
      /** @type {BotGuild[]} */
      let guildsJson = await guildsRes.json();
      // Sort guilds by configured or not
      guildsJson.sort((a, b) => {
        if (a.isConfigured && !b.isConfigured) return -1;
        if (!a.isConfigured && b.isConfigured) return 1;
        return 0;
      });
      this.guilds = guildsJson;
    }
  }
}
