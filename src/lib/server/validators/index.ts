import * as z from "zod";
import * as zMini from "zod/mini";

type ValidationRes<V extends z.ZodType> =
  | { success: true; readonly data: z.core.output<V>; error?: never }
  | { success: false; data?: never; error: string };

export class ZodValidator<V extends z.ZodType> {
  constructor(private validator: V) {}

  validate(value: unknown): ValidationRes<V> {
    const result = this.validator.safeParse(value);

    if (!result.success) {
      return {
        success: false,
        error: this.toHumanError(result.error),
      };
    }

    return {
      success: true,
      data: result.data,
    };
  }

  toHumanError(err: z.ZodError<z.core.output<V>>) {
    const errors: string[] = [];

    for (const iss of err.issues) {
      const pathLabel = iss.path.length > 0 ? iss.path.join(" > ") : "";
      errors.push(`${pathLabel}: ${iss.message}`);
    }

    return errors.join("\n");
  }
}

export const SnowflakeSchema = z.string().regex(/^\d{17,23}$/i);
export const MiniSnowflakeSchema = zMini.string().check(zMini.regex(/^\d{17,23}$/i));
export const ObjectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/i);
export const MiniObjectIdSchema = zMini.string().check(zMini.regex(/^[a-fA-F0-9]{24}$/i));
