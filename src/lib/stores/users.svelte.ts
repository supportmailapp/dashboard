import { page } from "$app/state";
import type { EventsMap } from "$lib/utils/websocket";
import type { APIUser } from "discord-api-types/v10";
import { SvelteMap } from "svelte/reactivity";

/**
 * A map to store users with their IDs as keys.
 */
export const users = new SvelteMap<string, APIUser>();
/**
 * A map to store mention users with their IDs as keys.
 */
export const mentionUsers = new SvelteMap<string, MentionUser>();

export function hasUsers(...userIds: string[]): boolean {
  return userIds.every((id) => users.has(id));
}

export function getUser(userId: string): APIUser | undefined {
  return users.get(userId);
}

export async function fetchUser(userId: string, filters?: { bot?: boolean }): Promise<APIUser | undefined> {
  const user = getUser(userId);
  if (user) {
    return user;
  }

  if (!page.data.ws || !page.data.guildId) {
    console.warn("WebSocket connection or guild ID is not available.");
    return undefined;
  }

  page.data.ws.emit("get-guild-users", { userIds: [userId], guildId: page.data.guildId, filters }, (res) => {
    if (res.success) {
      for (const u of res.data) {
        users.set(u.id, u);
      }
      console.log("Fetched user:", res.data);
    } else {
      console.error("Failed to fetch user:", res.error);
    }
  });
}

export function hasMentionUsers(...userIds: string[]): boolean {
  return userIds.every((id) => mentionUsers.has(id));
}

export function getMentionUser(userId: string): MentionUser | undefined {
  return mentionUsers.get(userId);
}

export async function fetchMentionUsers(userIds: string[]) {
  const fetchedUsers: MentionUser[] = [];

  if (!page.data.ws) {
    console.warn("WebSocket connection is not available.");
    return;
  }

  page.data.ws.emit("get-mention-users", { userIds }, (res) => {
    if (res.success) {
      for (const mUser of res.data) {
        mentionUsers.set(mUser.id, mUser);
        fetchedUsers.push(mUser);
      }
      console.log("Fetched mention users:", fetchedUsers);
    } else {
      console.error("Failed to fetch mention users", res.error);
    }
  });
}
