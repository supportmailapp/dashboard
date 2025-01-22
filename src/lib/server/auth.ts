import jwt from 'jsonwebtoken';

export type CookieToken = {
  access_token?: string;
  refresh_token?: string;
  expires_at: string; // ISO 8601
};

export function decodeToken(token: string): CookieToken {
  // return jwt.verify(token) as CookieToken;
  return {} as CookieToken;
}
