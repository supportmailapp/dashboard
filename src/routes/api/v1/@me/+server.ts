import { JsonErrors, zodLanguage } from "$lib/constants";
import { DBUser, getDBUser } from "$lib/server/db/index.js";
import { MyValidator } from "$lib/server/validators/index.js";
import z from "zod";

export async function GET({ locals }) {
  if (!locals.user?.id || !locals.token) {
    return JsonErrors.unauthorized();
  }

  const user = await getDBUser(locals.user.id);
  const sanitizedUser: { language: string; autoRedirect: boolean } = {
    language: user?.language || "en",
    autoRedirect: Boolean(user?.autoRedirect),
  };
  return Response.json(sanitizedUser, { status: 200, statusText: "OK" });
}

const putSchema = z.object({
  language: zodLanguage,
  autoRedirect: z.boolean(),
});

export async function PUT({ locals, request }) {
  if (!locals.user?.id) return JsonErrors.unauthorized();

  const body = await request.json();

  const valRes = new MyValidator(putSchema).validate(body);

  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  const user = await DBUser.findOneAndUpdate(
    {
      id: locals.user.id,
    },
    valRes.data,
    {
      upsert: true,
      new: true,
    },
  );

  const sanitizedUser: { language: string; autoRedirect: boolean } = {
    language: user.language,
    autoRedirect: user.autoRedirect,
  };

  return Response.json(sanitizedUser);
}
