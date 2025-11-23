import { createContext } from "svelte";

type FetchMethod = "POST" | "PUT" | "PATCH" | "DELETE";

class SavingConfig {
  public hasUnsavedChanges = $state(false);
  public saving = $state(false);
  public method = $state<FetchMethod | null>(null);
  public route = $state<string | null>(null);
  public payload = $state<any>(null);
  private onSuccess = (response: Response) => {};
  private onError = (response?: Response, error?: Error) => {};
  private onDiscard = () => {};
  private abortController = new AbortController();

  constructor() {}

  setSuccessCallback(callback: () => void) {
    this.onSuccess = callback;
  }

  setErrorCallback(callback: () => void) {
    this.onError = callback;
  }

  setDiscardCallback(callback: () => void) {
    this.onDiscard = callback;
  }

  public async saveData(): Promise<void> {
    this.saving = true;
    try {
      if (!this.method || !this.payload) {
        throw new Error("Method or payload not set");
      }

      const method = $state.snapshot(this.method);
      const payload = $state.snapshot(this.payload);
      const route = $state.snapshot(this.route!);
      const response = await fetch(route, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        this.onError(response);
      } else {
        this.onSuccess(response);
      }
    } catch (error) {
      this.onError(undefined, error as Error);
    }
  }

  public discardChanges() {
    this.onDiscard();
    this.abortController.abort();
  }

  public reset() {
    this.hasUnsavedChanges = false;
    this.saving = false;
    this.method = null;
    this.route = null;
    this.payload = null;
    this.abortController = new AbortController();
  }
}

const [getSavingConfig, setSavingConfig] = createContext<SavingConfig>();

export { setSavingConfig, getSavingConfig, SavingConfig };
