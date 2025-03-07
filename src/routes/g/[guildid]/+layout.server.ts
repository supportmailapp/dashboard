import { getNews } from "$lib/utils/news";

export const load = async () => {
  return {
    news: getNews(),
  };
};
