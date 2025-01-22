import type { PageServerLoad } from './$types.js';
import jwt from 'jsonwebtoken';

import { decodeToken, type CookieToken } from '$lib/server/auth.js';

/** @satisfies {PageServerLoad} */
export async function load({ params, cookies, fetch, locals, request, url }) {
  const cookieToken = cookies.get('user_token');
  if (!cookieToken) {
    return { status: 401, redirect: '/login' };
  }

  let tokenData = decodeToken(cookieToken);

  // Fetch user data from Discord API
  // Return server list
}
