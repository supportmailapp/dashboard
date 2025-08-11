import { JsonErrors } from "$lib/constants";

export async function GET({ params: { channelid: channelId }, locals }) {
  if (!/^\d{15,25}$/.test(channelId)) {
    return JsonErrors.badRequest("Invalid channel ID");
  }

  if (!locals.isAuthenticated()) {
    return JsonErrors.unauthorized();
  }

  try {
    const channelRes = await locals.discordRest.getGuildChannel(channelId);

    if (channelRes.isSuccess()) {
      return Response.json(channelRes.data);
    }
    return JsonErrors.notFound(channelRes.errorToString());
  } catch (err: any) {
    return JsonErrors.serverError(String(err.message ?? err));
  }
}
