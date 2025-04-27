import { getNews } from "$lib/utils/news";

export async function load() {
  return {
    news: getNews(),
  };
}
