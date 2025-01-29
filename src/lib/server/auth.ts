import jwt, { type JwtPayload } from "jsonwebtoken";

import { JWT_SECRET } from "$env/static/private";
import { authData } from "./constants";

const neededProps = ["sessionId", "access_token", "refresh_token", "expires_at", "userId"] as const;

export function encodeToken(token: CookieToken): string {
  return jwt.sign(token, JWT_SECRET, {
    algorithm: authData.algorithm,
    expiresIn: authData.expiresIn,
    encoding: "utf-8",
  });
}

export function decodeToken(token: any, verify?: false): JWTCookiePayload | null;
export function decodeToken(token: any, verify: true): Required<CookieToken> | null;

export function decodeToken(token: any, verify = false): JWTCookiePayload | Required<CookieToken> | null {
  if (typeof token !== "string") return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [authData.algorithm],
    }) as JWTCookiePayload;

    const tokenisValid = () => {
      return neededProps.every((prop) => prop in decoded);
    };

    if (verify && tokenisValid()) {
      return decoded as Required<CookieToken>;
    } else {
      return decoded;
    }
  } catch {
    return null;
  }
}
