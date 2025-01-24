import jwt, { type JwtPayload } from "jsonwebtoken";

import { JWT_SECRET } from "$env/static/private";
import { authData } from "./constants";

const neededProps = ["access_token", "refresh_token", "expires_at", "userId"] as const;

type CookieTokenProps = (typeof neededProps)[number];

export type CookieToken = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: string; // ISO 8601
  userId?: string;
};

export type FullCookieToken = Required<CookieToken>;

export type JWTCookiePayload = JwtPayload & CookieToken;

export function encodeToken(token: CookieToken): string {
  return jwt.sign(token, JWT_SECRET, {
    algorithm: authData.algorithm,
    expiresIn: authData.expiresIn,
    encoding: "utf-8",
  });
}

export function decodeToken(token: any): JWTCookiePayload | null {
  if (typeof token !== "string") return null;
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: [authData.algorithm],
    }) as JWTCookiePayload;
  } catch {
    return null;
  }
}

export function verifyTokenPayload(token: any): Required<CookieToken> | null {
  if (token) {
    return token as Required<CookieToken>;
  }
  return null;
}
