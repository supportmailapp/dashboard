import { dev } from "$app/environment";
import { PUBLIC_SENTRY_DSN } from "$env/static/public";
import * as Sentry from "@sentry/sveltekit";
import type { HandleClientError } from "@sveltejs/kit";

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

export const handleError: HandleClientError = async ({ error, event, status, message }) => {
  let id;
  if (!dev) {
    id = Sentry.captureException(error, {
      extra: { event, status },
    });
  } else {
    id = "development-mode";
  }

  return {
    message,
    id,
    status,
  };
};
