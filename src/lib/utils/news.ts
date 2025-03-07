const news: News[] = [
  {
    id: "topic_1",
    type: "info",
    title: "General Info",
    content: "Content 1",
  },
  {
    id: "topic_2",
    type: "success",
    title: "Welcome to the new dashboard!",
    content:
      "We've updated the dashboard to be more user-friendly and easier to navigate. If you have any feedback, please let us know!",
  },
  {
    id: "topic_3",
    type: "warning",
    title: "Warning Stuff",
    content: "Content 3",
  },
  {
    id: "topic_4",
    type: "error",
    title: "Error Stuff",
    content: "Content 4",
  },
];

export const getNews = () => {
  return news;
};

export const getNewsById = async (id: string) => {
  return news.find((item) => item.id === id);
};
