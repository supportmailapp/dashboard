import { APIRoutes, BASIC_GET_FETCH_INIT } from "$lib/constants";
import type { IDBUser } from "supportmail-types";

type UserState = {
  discord: BasicUser | null;
  db: IDBUser | null;
};

export const user = $state<UserState>({ discord: null, db: null });

export async function loadDbUser(userId: string) {
  const res = await fetch(APIRoutes.user(userId), BASIC_GET_FETCH_INIT);

  if (res.ok) {
    user.db = (await res.json()) as IDBUser;
  }
}
