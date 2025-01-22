import jwt, { type JwtPayload } from 'jsonwebtoken';

import { JWT_SECRET } from '$env/static/private';
import { authData } from '$lib/constants';

export type CookieToken = {
  access_token?: string;
  refresh_token?: string;
  expires_at: string; // ISO 8601
};

export type JWTCookiePayload = JwtPayload & CookieToken;

export function encodeToken(token: CookieToken): string {
  return jwt.sign(token, JWT_SECRET, {
    algorithm: authData.algorithm,
    expiresIn: authData.expiresIn,
    encoding: 'utf-8',
  });
}

export function decodeToken(token: string): JWTCookiePayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: [authData.algorithm],
    }) as JWTCookiePayload;
  } catch {
    return null;
  }
}
