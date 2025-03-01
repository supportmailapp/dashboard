import * as Sentry from "@sentry/sveltekit";
import { building } from "$app/environment";

if (!building) {
  Sentry.init({
    dsn: "https://f3539027417a80678d1015bba5b684e5@o4508704165265408.ingest.de.sentry.io/4508704168018000",
    tracesSampleRate: 1.0,
  });
}

// export const handleError: HandleClientError = async ({ error, event, status, message }) => {
//   console.error("Client error", error);

//   const errorId = Sentry.captureException(error, { extra: { event, status, message } });
//   console.log("Error ID:", errorId);
//   return {
//     status,
//     message: message || "Internal server error",
//     errorId,
//   };
// };
