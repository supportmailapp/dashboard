export async function load({ locals }) {
  return {
    user: locals.user,
    session: locals.session,
  };
}
