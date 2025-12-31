import { dev } from "$app/environment";
import * as Sentry from "@sentry/sveltekit";
import type { HandleClientError } from "@sveltejs/kit";

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
