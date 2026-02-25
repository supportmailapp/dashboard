import { error, json } from "@sveltejs/kit";

// yes, the original hostname is longer with "@" but the sentry client will parse it and only send the hostname part to the tunnel, so we need to use the parsed hostname here
const SENTRY_HOST = "o4508704165265408.ingest.de.sentry.io";
const PROJECT_ID = "4508704168018000";

export async function POST({ request }) {
  try {
    const envelopeBytes = await request.arrayBuffer();
    const envelope = new TextDecoder().decode(envelopeBytes);
    const piece = envelope.split("\n")[0];
    const header = JSON.parse(piece);
    const dsn = new URL(header["dsn"]);
    const project_id = dsn.pathname?.replace("/", "");
    if (dsn.hostname !== SENTRY_HOST) {
      console.log("dsn hostname unvalid", dsn.hostname);
      error(400, `Invalid sentry hostname: ${dsn.hostname}`);
    }
    if (project_id !== PROJECT_ID) {
      error(400, `Invalid sentry project id: ${project_id}`);
    }
    const upstream_sentry_url = `https://${SENTRY_HOST}/api/${project_id}/envelope/`;
    await fetch(upstream_sentry_url, {
      method: "POST",
      body: envelopeBytes,
    });
    return json({}, { status: 200 });
  } catch (e) {
    console.error("error tunneling to sentry", e);
    return json({ error: "error tunneling to sentry" }, { status: 500 });
  }
}
