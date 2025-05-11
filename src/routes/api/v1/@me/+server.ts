import { ErrorResponses } from "$lib/constants";
import { fetchDBUser } from "$lib/server/auth.js";
import { DBUser } from "$lib/server/db/index.js";
import { verifyLanguage } from "$lib/server/db/utils.js";

export async function GET({ locals }) {
  if (!(locals.userId && locals.token)) return ErrorResponses.unauthorized();

  const user = await fetchDBUser(locals.userId);
  const sanitizedUser: { language: string; autoRedirect: boolean } = {
    language: user?.language || "en",
    autoRedirect: Boolean(user?.autoRedirect),
  };
  return Response.json(sanitizedUser, { status: 200, statusText: "OK" });
}

export async function PUT({ locals, request }) {
  if (!locals.userId) return ErrorResponses.unauthorized();

  const { language, autoRedirect } = await request.json();
  if (!verifyLanguage(language)) {
    return ErrorResponses.badRequest("Invalid language");
  }
  if (typeof autoRedirect !== "boolean") {
    return ErrorResponses.badRequest("Invalid autoRedirect");
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
