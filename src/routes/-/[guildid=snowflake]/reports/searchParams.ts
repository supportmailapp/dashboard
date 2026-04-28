import * as z from "zod/mini";

export type ReportSearchScope = "all" | "author" | "comment" | "message" | "moderator" | "user" | "reason";
export type ReportSearchType = "all" | "message" | "user";

export const searchParamsSchema = z.object({
  page: z._default(z.coerce.number(), 1).check(z.positive()),
  pageSize: z._default(z.coerce.number(), 20).check(z.gte(10), z.lte(100)),
  // -1 = all; matches the API's sentinel value
  status: z._default(z.coerce.number(), -1),
  type: z._default(z.enum(["all", "message", "user"]), "all"),
  search: z._default(z.string(), "").check(z.maxLength(512)),
  sscope: z._default(
    z.enum(["all", "author", "comment", "message", "moderator", "user", "reason"]),
    "all",
  ),
});
