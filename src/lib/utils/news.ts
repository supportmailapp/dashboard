const news: News[] = [];

export const getNews = () => {
  return news;
};

export const getNewsById = async (id: string) => {
  return news.find((item) => item.id === id);
};
