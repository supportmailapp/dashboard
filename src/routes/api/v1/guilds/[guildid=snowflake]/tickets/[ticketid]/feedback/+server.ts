import { JsonErrors } from "$lib/constants";
import { Feedback, FlattenDateFields, FlattenDocToJSON } from "$lib/server/db";
import { json } from "@sveltejs/kit";

export async function GET({ params }) {
  const feedback = await Feedback.findOne({
    guildId: params.guildid,
    ticketId: params.ticketid,
  });

  if (!feedback) {
    return JsonErrors.notFound("Feedback not found");
  }

  return json(FlattenDateFields(FlattenDocToJSON(feedback, true), "timestamp"));
}
