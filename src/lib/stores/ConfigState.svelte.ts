import equal from "fast-deep-equal";

export type PossibleConfig = string | number | bigint | Date | boolean | Array<any> | Record<string, any>;

/**
 * Custom deep clone function that handles objects that cannot be structured cloned.
 * Properly handles primitives, Dates, Arrays, and POJOs.
 */
function deepClone<T>(obj: T): T {
  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives (string, number, boolean, bigint)
  if (typeof obj !== "object") {
    return obj;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T;
  }

  // Try structuredClone first for complex objects
  try {
    return structuredClone(obj);
  } catch (error) {
    // Fallback for objects that can't be structured cloned
    try {
      // Handle plain objects with JSON serialization
      if (obj.constructor === Object || obj.constructor === undefined) {
        return JSON.parse(JSON.stringify(obj));
      }

      // For other object types, try to create a new object and copy properties
      const cloned = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          (cloned as any)[key] = deepClone((obj as any)[key]);
        }
      }
      return cloned;
    } catch (jsonError) {
      // If all else fails, return the original object
      console.warn("Failed to clone object, returning original:", jsonError);
      return obj;
    }
  }
}

/**
 * A generic class to manage configuration state with optional loading state.
 *
 * @template T - The type of the configuration. Defaults to `PossibleConfig`, which can be literally anything.
 */
export class ConfigState<T extends PossibleConfig> {
  private _backup: T | null = null;
  /**
   * Internal state for the configuration.
   * Initialized to `null` by default.
   */
  private _config = $state<T | null>(null);

  /**
   * internal state indicating whether the configuration is currently saving.
   *
   * @default
   * false
   */
  private _saving = $state<boolean>(false);

  /**
   * State indicating whether the configuration is currently loading.
   *
   * @default
   * true
   */
  public loading = $state<boolean>(true);

  /**
   * State indicating whether there are unsaved changes.
   *
   * @default false
   */
  public unsaved = $state<boolean>(false);

  /**
   * Constructs a new instance of `ConfigState`.
   *
   * @param initConfig - Initial configuration. Defaults to `undefined`.
   * If `undefined`, the configuration is set to `null`.
   *
   * @param initLoading - Initial loading state. Defaults to `true`.
   */
  public constructor(initConfig: T | null | undefined = undefined, initLoading: boolean = true) {
    this._backup = !!initConfig ? deepClone(initConfig) : null;
    this._config = initConfig ?? null;
    this.loading = initLoading;
  }

  /**
   * Retrieves the current configuration.
   *
   * @returns The current configuration, or `null` if no configuration is set.
   */
  public get config(): T | null {
    return this._config;
  }

  /**
   * Indicator, whether the config is currently being saved.
   *
   * It's bound to `.loading` - when setting this, `.loading` is also set automatically.
   */
  public get saving(): boolean {
    return this._saving;
  }

  // If it's saving, it's also loading at the same time.
  public set saving(_s: boolean) {
    this._saving = _s;
    this.loading = _s;
  }

  public get backup(): T | null {
    return this._backup;
  }

  /**
   * Take a snapshot of the current config.
   * @returns A snapshot of the current config
   */
  public snap(): $state.Snapshot<T> | null {
    return $state.snapshot(this._config);
  }

  /**
   * Determines whether the current configuration state has unsaved changes.
   * Compares the current configuration snapshot with the backup to check for differences.
   * Updates the `unsaved` property to reflect the result.
   *
   * @returns Snapshot of `this.unsaved`.
   */
  public evalUnsaved(): boolean {
    this.unsaved = !equal(this.snap(), this._backup);
    return $state.snapshot(this.unsaved);
  }

  /**
   * Updates the configuration.
   *
   * @param config - The new configuration, or `null` to clear the configuration.
   * @returns The newly set config value.
   */
  public setConfig(config: T | null): T | null {
    this._config = config;
    return this._config;
  }

  /**
   * Saves the provided configuration and updates the internal state.
   *
   * This method replaces the current configuration with the new one,
   * creates a backup of the new configuration using `structuredClone`,
   * and resets the `unsaved` and `saving` flags to `false`.
   *
   * @template T The type of the configuration object.
   * @param newConf The new configuration object to save.
   * @returns The cloned backup of the new configuration.
   */
  public saveConfig(newConf: T): T {
    this._config = newConf;
    this._backup = deepClone(newConf);
    this.unsaved = false;
    this.saving = false;
    return this._backup;
  }

  /**
   * Sets the backup value for the current state.
   *
   * @param backup - The backup value to be set, or `null` to clear the backup.
   * @returns The newly set backup value.
   */
  public setBackup(backup: T | null): T | null {
    this._backup = backup;
    return this._backup;
  }

  /**
   * Marks the current state as unsaved.
   *
   * This method sets the `unsaved` property to `true`, indicating that there are changes
   * that have not been saved yet.
   */
  public setUnsaved() {
    this.unsaved = true;
  }

  /**
   * Determines if a non-null configuration is set.
   *
   * @returns `true` if the configuration is not `null`, otherwise `false`.
   * When `true`, the instance type is narrowed to include a non-null configuration.
   */
  public isConfigured(): this is ConfigState<T> & { config: NonNullable<T> } {
    return this._config !== null;
  }

  /**
   * Clears the current configuration by setting it to `null`.
   *
   * @returns A type guard indicating that the instance is now of type `ConfigState<T> & { config: null }`.
   */
  public clear(): this is Omit<ConfigState<T>, "config"> & { config: null } {
    this._config = null;
    return true;
  }
}
