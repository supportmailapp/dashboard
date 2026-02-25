import * as Sentry from "@sentry/sveltekit";

// This is ONLY for server-side instrumentation, client-side is handled in hooks.client.ts (dont ask me why)

Sentry.init({
  dsn: "https://f3539027417a80678d1015bba5b684e5@o4508704165265408.ingest.de.sentry.io/4508704168018000",
  tracesSampleRate: 0.6,
  enableLogs: true,
  enableMetrics: true,
  sendDefaultPii: true,
});
