import { APIRoutes, BASIC_GET_FETCH_INIT } from "$lib/constants";

type GuildsState = {
  value: DCGuild[];
  get: () => DCGuild[];
  set: (newValue: DCGuild[]) => DCGuild[];
};

export const guilds = $state<GuildsState>({
  value: [],
  get: function () {
    return this.value;
  },
  set: function (newValue: DCGuild[]): DCGuild[] {
    this.value = newValue;
    return this.value;
  },
});

export async function loadGuilds() {
  if (!guilds.get().length) {
    const guildsRes = await fetch(APIRoutes.userGuilds({ manageBotOnly: true }), BASIC_GET_FETCH_INIT);
    console.log("guildsRes", guildsRes);

    if (guildsRes.ok) {
      let guildsJson = (await guildsRes.json()) as DCGuild[];
      // Sort guilds by configured or not
      guildsJson.sort((a, b) => {
        if (a.isConfigured && !b.isConfigured) return -1;
        if (!a.isConfigured && b.isConfigured) return 1;
        return 0;
      });
      guilds.set(guildsJson);
    }
  }
}
