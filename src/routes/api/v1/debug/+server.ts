export const GET = async ({ request }) => {
  const data = await request.json();
  console.log(data);
  return new Response(null, { status: 200 });
};
