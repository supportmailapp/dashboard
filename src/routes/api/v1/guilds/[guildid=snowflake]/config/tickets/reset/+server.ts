import { JsonErrors } from "$lib/constants";
import { DBGuild, FeedbackConfig, TicketCategory } from "$lib/server/db/index.js";
import { ZodValidator } from "$lib/server/validators/index.js";
import { ResetTicketsSchema } from "$v1Api/assertions.js";

export async function POST({ params, locals, request }) {
  if (!locals.user) return JsonErrors.unauthorized();

  const guildId = params.guildid;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return JsonErrors.badRequest("Invalid JSON body");
  }

  const valRes = new ZodValidator(ResetTicketsSchema).validate(body);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  const toReset = valRes.data;
  if (toReset.has("forum")) {
    await DBGuild.updateOne(
      { id: guildId },
      {
        $set: {
          "ticketConfig.forumId": null,
          "ticketConfig.enabled": false,
          "ticketConfig.pausedUntil": { date: null, value: false },
        },
        $unset: { "ticketConfig.tags": "", "ticketConfig.webhookDocId": "" },
      },
    );
  }

  if (toReset.has("categories")) {
    await TicketCategory.deleteMany({ guildId });
  }

  if (toReset.has("feedback")) {
    await FeedbackConfig.deleteOne({ guildId });
  }

  if (toReset.has("anonym")) {
    await DBGuild.updateOne(
      { id: guildId },
      {
        $set: {
          "ticketConfig.anonym": {
            enabled: false,
            user: false,
            alias: null,
          },
        },
      },
    );
  }

  if (toReset.has("other")) {
    await DBGuild.updateOne(
      { id: guildId },
      {
        $set: {
          "ticketConfig.autoForwarding": true,
        },
        $unset: {
          "ticketConfig.allowedBots": "",
          "ticketConfig.pings": "",
        },
      },
    );
  }

  return new Response(null, { status: 204 });
}
