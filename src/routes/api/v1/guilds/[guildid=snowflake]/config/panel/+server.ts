import { JsonErrors } from "$lib/constants.js";
import { FlattenDateFields, FlattenDocToJSON, Panel } from "$lib/server/db";
import { ZodValidator } from "$lib/server/validators/index.js";
import type { APIPanel, IPanel } from "$lib/sm-types/src/index.js";
import { DBAllowedMentionsSchema, PanelSchema } from "$v1Api/assertions.js";
import { json } from "@sveltejs/kit";
import type { HydratedDocument } from "mongoose";

function buildPanelResponse(guildId: string, panelDoc: any): APIPanel {
  return Object.assign(
    {
      guildId: guildId,
      data: [],
      allowedMentions: {
        everyone: false,
        roles: [],
        users: [],
        roleMode: "none",
        userMode: "none",
      },
    } satisfies APIPanel,
    panelDoc,
  );
}

function dbPanelToAPI(panel: HydratedDocument<IPanel>) {
  const { allowedMentions, ...rest } = FlattenDateFields(
    FlattenDocToJSON(panel, true),
    "createdAt",
    "updatedAt",
  );
  return buildPanelResponse(panel.guildId, {
    ...rest,
    allowedMentions: DBAllowedMentionsSchema.parse(allowedMentions || {}),
  }); // This should NEVER error, since we generated that ourselves
}

export async function GET({ params }) {
  const panel = await Panel.findOne({ guildId: params.guildid });

  if (!panel) {
    return JsonErrors.notFound("Panel configuration not found");
  }

  return json(dbPanelToAPI(panel));
}

export async function PUT({ params, request }) {
  const data = await request.json().catch(() => null);
  if (!data) {
    return JsonErrors.badRequest("Invalid JSON body");
  }

  const valRes = new ZodValidator(PanelSchema).validate(data);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  const panel = await Panel.findOneAndUpdate(
    {
      guildId: params.guildid,
    },
    {
      ...valRes.data,
    },
    { upsert: true, returnDocument: "after" },
  );

  return json(dbPanelToAPI(panel));
}
