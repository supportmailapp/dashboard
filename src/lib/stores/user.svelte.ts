import { APIRoutes } from "$lib/urls";
import { BASIC_GET_FETCH_INIT } from "$lib/constants";
import type { IDBUser } from "supportmail-types";

type UserState = {
  discord: BasicUser | null;
  db: IDBUser | null;
};

export let user = $state<UserState>({ discord: null, db: null });

export async function loadDbUser() {
  const res = await fetch(APIRoutes.user(), BASIC_GET_FETCH_INIT);

  if (res.ok) {
    user.db = (await res.json()) as IDBUser;
  } else {
    console.error("Failed to load user data", res);
  }
}
