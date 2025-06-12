// Public constants

export const JsonErrors = {
  /**
   * 400 Bad Request
   */
  badRequest: (message: string = "") => Response.json({ error: message || "Bad Request" }, { status: 400 }),
  /**
   * 401 Unauthorized
   */
  unauthorized: (message: string = "") =>
    Response.json({ error: message || "Unauthorized" }, { status: 401 }),
  /**
   * 403 Forbidden
   */
  forbidden: (message: string = "") => Response.json({ error: message || "Forbidden" }, { status: 403 }),
  /**
   * 404 Not Found
   */
  notFound: (message: string = "") => Response.json({ error: message || "Not Found" }, { status: 404 }),
  /**
   * 409 Conflict
   */
  conflict: (message: string = "") => Response.json({ error: message || "Conflict" }, { status: 409 }),
  /**
   * 429 Too Many Requests
   */
  tooManyRequests: (message: string = "") =>
    Response.json({ error: message || "Too Many Requests" }, { status: 429 }),
  /**
   * 500 Internal Server Error
   */
  serverError: (message: string = "") =>
    Response.json({ error: message || "Internal Server Error" }, { status: 500 }),
} as const;

export const LANGUAGES = [
  {
    value: "en",
    name: "English",
  },
  {
    value: "de",
    name: "Deutsch",
  },
  {
    value: "fr",
    name: "Français",
  },
] as const;

export const BasicFetchInit = (m: "GET" | "POST" | "PATCH" | "PUT" | "DELETE") => {
  return {
    method: m,
    headers: {
      "Content-Type": "application/json",
    },
  };
};
