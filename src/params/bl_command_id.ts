import { PUBLIC_BLACKLIST_COMMAND_ID } from "$env/static/public";

export function match(param?: string) {
  return param === PUBLIC_BLACKLIST_COMMAND_ID;
}
