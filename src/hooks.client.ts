import { dev } from "$app/environment";
import { PUBLIC_SENTRY_DSN } from "$env/static/public";
import { handleErrorWithSentry } from "@sentry/sveltekit";
import * as Sentry from "@sentry/sveltekit";

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});


export const handleError = !dev ? handleErrorWithSentry() : () => {};
