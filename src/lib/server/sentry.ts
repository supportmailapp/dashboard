import { env } from "$env/dynamic/private";
import Sentry from "@sentry/sveltekit";

Sentry.init({
  dsn: env.sentryDSN,

  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  release: env.version,

  integrations: [
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
      isEmailRequired: true,
    }),
  ],
});

export default Sentry;
