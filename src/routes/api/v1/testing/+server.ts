import { decrypt, encrypt, UserToken } from "$db";
import dayjs from "dayjs";

export const GET = async ({ url }) => {
  const value = url.toString().split("?")[1] || "abc";
  const enc = encrypt(value);
  const dec = decrypt(enc);
  return Response.json({ success: true, value, enc, dec });
};

// export const GET = async ({ url }) => {
//   const token = url.toString().split("?")[1] || "abc";
//   const res = await UserToken.create({
//     userId: Date.now().toString(),
//     accessToken: token,
//     expiresAt: dayjs().add(1, "month").toDate(),
//   });
//   const doc = res.toJSON();
//   return Response.json(doc);
// };
