import { JsonErrors } from "$lib/constants";
import { FlattenDocToJSON, updateDBGuild } from "$lib/server/db/utils.js";
import { MyValidator } from "$lib/server/validators/index.js";
import z from "zod";

const putSchema = z.object({
  value: z.boolean(),
  date: z.iso.datetime({ offset: true, local: true, abort: true }).nullable(),
});

export type PUTPausingObject = z.infer<typeof putSchema>;

export async function PUT({ locals, params, request }) {
  if (!locals.token && !locals.user) return JsonErrors.badRequest();

  if (params.modul !== "tickets" && params.modul !== "reports") {
    return JsonErrors.badRequest('Invalid module supplied. Must be "tickets" or "reports".');
  }

  const body = await request.json();
  if (!body) {
    return JsonErrors.badRequest("Missing body?");
  }

  const valRes = new MyValidator(putSchema).validate(body);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  const configKey = params.modul === "tickets" ? "ticketConfig" : "reportConfig";

  const newDBGuild = await updateDBGuild(locals.guildId!, {
    $set: {
      [`${configKey}.pausedUntil`]: {
        value: valRes.data.value,
        date: valRes.data.date,
      },
    },
  });

  if (!newDBGuild) {
    return JsonErrors.notFound();
  }

  const flat = FlattenDocToJSON(newDBGuild)[configKey]["pausedUntil"];
  console.log("flat", flat);

  return Response.json({
    value: flat?.value,
    date: flat?.date?.toISOString() ?? null,
  } as APIPausedUntil);
}
