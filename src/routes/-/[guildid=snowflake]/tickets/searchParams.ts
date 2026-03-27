import { TicketStatus } from "$lib/sm-types/src";
import { MiniObjectIdSchema, MiniSnowflakeSchema } from "$lib/utils/schemas.js";
import * as z from "zod/mini";

// @ts-ignore
const ISOTimestampCodec = z.codec(z.string(), z.date(), {
  decode: (str) => new Date(str),
  encode: (date) => date.toISOString(),
});

export const searchParamsSchema = z.object({
  page: z._default(z.coerce.number(), 1).check(z.positive()),
  limit: z._default(z.coerce.number(), 25).check(z.gte(1), z.lte(100)),
  status: z
    ._default(z.array(z.enum(TicketStatus)), [TicketStatus.open])
    .check(z.minLength(1, "At least one status must be selected")),
  userId: z._default(z.xor([MiniSnowflakeSchema, z.literal("")]), ""),
  postId: z._default(z.xor([MiniSnowflakeSchema, z.literal("")]), ""),
  category: z._default(z.array(MiniObjectIdSchema), []),
  anonym: z._default(z.coerce.boolean(), true),
  comment: z._default(z.string(), "").check(z.maxLength(512, "Max comment length is 512 characters")),
  // before: z._default(ISOTimestampCodec, new Date()),
  // after: z._default(ISOTimestampCodec, new Date(0)),
});
