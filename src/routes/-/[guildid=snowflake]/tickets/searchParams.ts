import { MiniObjectIdSchema, MiniSnowflakeSchema } from "$lib/utils/schemas.js";
import * as z from "zod/mini";

// @ts-ignore
const ISOTimestampCodec = z.codec(z.string(), z.date(), {
  decode: (str) => new Date(str),
  encode: (date) => date.toISOString(),
});

export const searchParamsSchema = z
  .object({
    page: z._default(z.coerce.number(), 1).check(z.positive()),
    limit: z._default(z.coerce.number(), 25).check(z.gte(1), z.lte(100)),
    status: z
      ._default(z.array(z.enum(["open", "closed", "deleted"])), ["open"])
      .check(z.minLength(1, "At least one status must be selected")),
    userId: z._default(z.xor([MiniSnowflakeSchema, z.literal("")]), ""),
    category: z._default(z.array(MiniObjectIdSchema), []),
    uncategorized: z._default(z.coerce.boolean(), false),
    // before: z._default(ISOTimestampCodec, new Date()),
    // after: z._default(ISOTimestampCodec, new Date(0)),
  })
  .check(
    z.superRefine((data, ctx) => {
      // uncategorized can only be true if at least one category is selected
      if (data.uncategorized && data.category.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["uncategorized"],
          message: "Cannot filter uncategorized when no categories are selected",
        });
      }
    }),
  );
