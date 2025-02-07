type UserState = {
  value: BasicUser | null;
  get: () => BasicUser | null;
  set: (_new: BasicUser | null) => BasicUser | null;
};

export const user = $state<UserState>({
  value: null,
  get: function () {
    return this.value;
  },
  set: function (_new: BasicUser | null) {
    this.value = _new;
    return this.value;
  },
});
