import { dev } from "$app/environment";
import type { HandleClientError } from "@sveltejs/kit";

import * as Sentry from "@sentry/sveltekit";

Sentry.init({
  dsn: "https://f3539027417a80678d1015bba5b684e5@o4508704165265408.ingest.de.sentry.io/4508704168018000",
  tracesSampleRate: 0.7,
  enableLogs: true,
  enableMetrics: true,
  sendDefaultPii: true,
  tunnel: "/api/v1/tunnel",
});

export const handleError: HandleClientError = async ({ error, event, status, message }) => {
  let id;
  if (!dev) {
    id = Sentry.captureException(error, {
      extra: { event, status },
    });
  } else {
    id = "development-mode";
    console.error("Error captured:", { error, event, status });
  }

  return {
    message,
    id,
    status,
  };
};
