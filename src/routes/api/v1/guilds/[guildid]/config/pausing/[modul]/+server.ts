import { JsonErrors } from "$lib/constants";
import { FlattenDocToJSON, updateDBGuild } from "$lib/server/db/utils.js";
import { ZodValidator } from "$lib/server/validators/index.js";
import dayjs from "dayjs";
import z from "zod";

const putSchema = z.object({
  value: z.boolean(),
  date: z.iso.datetime({ offset: true, local: true, abort: true }).nullable(),
});

export type PUTPausingObject = z.infer<typeof putSchema>;

export async function PUT({ locals, params, request }) {
  if (params.modul !== "tickets" && params.modul !== "reports") {
    return JsonErrors.badRequest('Invalid module supplied. Must be "tickets" or "reports".');
  }

  const body = await request.json();
  console.log("body", body);
  if (!body) {
    return JsonErrors.badRequest("Missing body?");
  }

  const valRes = new ZodValidator(putSchema).validate(body);
  console.log("valRes", valRes);
  if (!valRes.success) {
    console.log("no success", valRes.error);
    return JsonErrors.badRequest(valRes.error.message);
  }
  console.log("success", valRes.data);

  const pauseDjs = valRes.data.date ? dayjs(valRes.data.date) : null;
  if (pauseDjs && !pauseDjs.isValid()) {
    return JsonErrors.badRequest("Invalid Date.");
  } else if (pauseDjs?.isBefore(new Date())) {
    return JsonErrors.badRequest("Invalid Date. Must be in the future!");
  }

  const configKey = params.modul === "tickets" ? "ticketConfig" : "reportConfig";

  const newDBGuild = await updateDBGuild(locals.guildId!, {
    $set: {
      [`${configKey}.pausedUntil`]: {
        value: valRes.data.value,
        date: pauseDjs?.toDate() ?? null,
      },
    },
  });

  if (!newDBGuild) {
    return JsonErrors.notFound();
  }

  const flat = FlattenDocToJSON(newDBGuild)[configKey]["pausedUntil"];
  console.log("flat", flat);

  console.log("1", new ZodValidator(putSchema).validate({}));
  console.log("2", new ZodValidator(putSchema).validate("asasd"));
  console.log("3", new ZodValidator(putSchema).validate(false));
  console.log(
    "4",
    new ZodValidator(putSchema).validate({
      value: false,
      date: null,
    }),
  );

  return Response.json({
    value: flat?.value,
    date: flat?.date?.toISOString() ?? null,
  } as APIPausedUntil);
}
