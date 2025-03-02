import { redirect } from "@sveltejs/kit";

export const GET = async ({ cookies }) => {
  cookies.delete("session", { path: "/" });
  return redirect(302, "/login");
};
