export async function load({ locals }) {
  return {
    isAdmin: Boolean(locals.isAdmin?.()),
  }
}