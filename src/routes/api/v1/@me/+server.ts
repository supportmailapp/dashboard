import { JsonErrors } from "$lib/constants";
import { DBUser } from "$lib/server/db/index.js";
import { verifyLanguage } from "$lib/server/db/utils.js";

export async function GET({ locals }) {
  if (!(locals.user?.id && locals.token)) return JsonErrors.unauthorized();

  const user = await fetchDBUser(locals.user.id);
  const sanitizedUser: { language: string; autoRedirect: boolean } = {
    language: user?.language || "en",
    autoRedirect: Boolean(user?.autoRedirect),
  };
  return Response.json(sanitizedUser, { status: 200, statusText: "OK" });
}

export async function PUT({ locals, request }) {
  if (!locals.user?.id) return JsonErrors.unauthorized();

  const { language, autoRedirect } = await request.json();
  if (!verifyLanguage(language)) {
    return JsonErrors.badRequest("Invalid language");
  }
  if (typeof autoRedirect !== "boolean") {
    return JsonErrors.badRequest("Invalid autoRedirect");
  }

  await DBUser.updateOne(
    {
      id: locals.userId,
    },
    {
      language: language,
      autoRedirect: autoRedirect,
    },
    {
      upsert: true,
    },
  );

  return new Response(null, {
    status: 204,
    statusText: "No Content",
  });
}
