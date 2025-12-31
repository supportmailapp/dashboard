import { env } from "$env/dynamic/private";
import jwt from "jsonwebtoken";

export async function load({ locals, parent, cookies }) {
  await parent();

  cookies.set(
    "img_token",
    jwt.sign({ foo: crypto.randomUUID() }, env.JWT_SECRET, {
      algorithm: "HS512",
      audience: "supportmail-website",
      issuer: "supportmail-website",
      subject: "img-access",
      expiresIn: "1h",
    }),
    { path: "/" },
  );

  return {
    user: locals.user,
  };
}
