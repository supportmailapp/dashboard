import { PersistedState } from "runed";

export const isVpn = new PersistedState<{ seen: boolean | null; value: boolean | null }>(
  "isVpn",
  { seen: null, value: null },
  { storage: "session", syncTabs: false },
);
