export const prerender = false;

export async function load({ locals }) {
  console.log("Loading +layout.server.ts");
  console.log("User:", locals.user);
  return {
    user: locals.user,
  };
}
