import * as z from "zod/mini";
export const MiniSnowflakeSchema = z.string().check(z.regex(/^\d{17,23}$/i));
export const MiniObjectIdSchema = z.string().check(z.regex(/^[a-fA-F0-9]{24}$/i));