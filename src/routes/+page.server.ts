import { redirect, type Actions } from "@sveltejs/kit";

export const prerender = false;

// const valkey = new Valkey(); // TODO: use this to cache guilds in a seperate file

export const load = async ({ cookies, url }) => {
  if (url.pathname == "/?logout=true") {
    cookies.delete("session", { path: "/" });
    return {};
  }
};

export const actions = {
  logout: async ({ cookies }) => {
    cookies.delete("session", { path: "/" });
    return redirect(302, "/");
  },
} satisfies Actions;
