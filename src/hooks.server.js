// import { dbConnect } from "$lib/utils/dbInternal";
// import verifyLogin, { responseOK } from "$lib/utils/verifyLogin";

import { redirect } from '@sveltejs/kit';

/** @type {import('@sveltejs/kit').ServerInit} */
export async function init() {
  // await dbConnect();
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  // const loggedIn = await verifyLogin(event.cookies).catch(() => null);
  event.locals.loggedIn = true;

  if (!event.url.pathname.startsWith('/api')) {
    if (!event.locals.loggedIn) return redirect(401, '/login');
    if (event.url.pathname === '/') return redirect(301, '/home');
  }

  const response = await resolve(event);
  return response;
}

// export async function handleError() {}
