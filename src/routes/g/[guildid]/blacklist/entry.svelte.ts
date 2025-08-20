import { SvelteBitfield } from "$lib/utils/reactiveBitfield.svelte";
import type { APIUser } from "discord-api-types/v10";
import { BlacklistScope, EntityType } from "supportmail-types";
import { toast } from "svelte-sonner";
import type { APIBlacklistEntry } from "../../../api/v1/guilds/[guildid]/blacklist/+server";

export class BLEntry {
  id = $state("");
  type = $state<Exclude<EntityType, EntityType.guild>>(EntityType.user);
  scopes = new SvelteBitfield();
  popupOpen = $state(false);
  dialogOpen = $state(false);
  customAnchor = $state<HTMLElement | null>(null);
  readonly canOpenPopup = $derived(this.id === "");
  loading = $state(false);

  setRole(role: GuildRole) {
    this.id = role.id;
    this.type = EntityType.role;
    this.popupOpen = false;
  }

  setUser(user: APIUser) {
    this.id = user.id;
    this.type = EntityType.user;
    this.popupOpen = false;
  }

  loadFrom(entry: APIBlacklistEntry) {
    this.loading = false;
    this.id = entry.id;
    this.type = entry._type;
    this.scopes.clear();
    this.scopes.set(entry.scopes);
  }

  clear() {
    this.id = "";
    this.type = EntityType.user;
    this.scopes.clear();
    this.popupOpen = false;
    this.loading = false;
    if (this.dialogOpen) {
      this.dialogOpen = false;
    }
  }
}

export const dialogFields = {
  types: [
    { label: "User", value: EntityType.user },
    { label: "Role", value: EntityType.role },
  ],
  scopes: [
    { label: "Tickets", value: BlacklistScope.tickets },
    { label: "Reports", value: BlacklistScope.reports },
    { label: "Tags", value: BlacklistScope.tags },
  ],
} as const;

export function toggleScope(entryObj: BLEntry, scopeValue: Exclude<BlacklistScope, BlacklistScope.global>) {
  // Check if this is the only bit set and we're trying to unset it
  if (entryObj.scopes.has(scopeValue) && entryObj.scopes.popCount() === 1) {
    toast.error("You cannot do that!", {
      description: "At least one scope is required.",
      closeButton: false,
    });
    return;
  }

  entryObj.scopes.toggle(scopeValue);
}
