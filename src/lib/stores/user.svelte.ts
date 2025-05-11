type UserState = {
  discord: BasicUser | null;
};

export let user = $state<UserState>({ discord: null });
