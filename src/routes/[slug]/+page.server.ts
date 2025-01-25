import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  console.log(params.slug);

  // Fetch channels and roles and find the current guild id

  return {
    slug: /\d+/.test(params.slug) ? params.slug : "404",
  };
};
