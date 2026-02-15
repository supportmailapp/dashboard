export async function load({ params, parent, url }) {
  const pData = await parent();

  return {
    user: pData.user,
  };
}
