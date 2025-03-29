import { getNews } from "$lib/utils/news";

export const load = async ({ params }) => {
  return {
    news: getNews(),
    guildId: params.guildid,
  };
};
