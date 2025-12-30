export async function load({ locals, parent }) {
  await parent();
  return {
    user: locals.user,
  };
}
