// Public constants

import { dev } from "$app/environment";
import z from "zod";

export const JsonErrors = {
  /**
   * 400 Bad Request
   */
  badRequest: (message: string = "") => Response.json({ message: message || "Bad Request" }, { status: 400 }),
  /**
   * 401 Unauthorized
   */
  unauthorized: (message: string = "") =>
    Response.json({ message: message || "Unauthorized" }, { status: 401 }),
  /**
   * 403 Forbidden
   */
  forbidden: (message: string = "") => Response.json({ message: message || "Forbidden" }, { status: 403 }),
  /**
   * 404 Not Found
   */
  notFound: (message: string = "") => Response.json({ message: message || "Not Found" }, { status: 404 }),
  /**
   * 409 Conflict
   */
  conflict: (message: string = "") => Response.json({ message: message || "Conflict" }, { status: 409 }),
  /**
   * 429 Too Many Requests
   */
  tooManyRequests: (message: string = "") =>
    Response.json({ message: message || "Too Many Requests" }, { status: 429 }),
  /**
   * 500 Internal Server Error
   */
  serverError: (message: string = "") =>
    Response.json({ message: message || "Internal Server Error" }, { status: 500 }),
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

export const zodLanguage = z.union(LANGUAGES.map((l) => z.literal(l.value)));

export const BasicFetchInit = (m: "GET" | "POST" | "PATCH" | "PUT" | "DELETE") => {
  return {
    method: m,
    headers: {
      "Content-Type": "application/json",
    },
  };
};

export const pausePresets = [
  { value: 1, label: "Tomorrow" },
  { value: 7, label: "In a week" },
  { value: 14, label: "In two weeks" },
  { value: 30, label: "In a month" },
];

export const ORIGIN = dev ? "http://localhost:5050" : "https://dash.supportmail.dev";
export const WS_ORIGIN = dev ? "ws://localhost:4000" : "wss://ws.supportmail.dev";

const CommandnameRegex = `^[-_'\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$`;
export const CommandpathRegex = new RegExp(`^${CommandnameRegex}(\\/${CommandnameRegex}){0,2}$`, "u");