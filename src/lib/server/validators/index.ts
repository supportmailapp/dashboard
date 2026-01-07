import { z } from "zod";
import { ValidationError, fromZodError } from "zod-validation-error";

type ValidationRes<V extends z.ZodType> =
  | { success: true; readonly data: z.core.output<V>; error?: never }
  | { success: false; data?: never; error: ValidationError };

export class ZodValidator<V extends z.ZodType> {
  constructor(private validator: V) {}

  public validate(value: unknown): ValidationRes<V> {
    const result = this.validator.safeParse(value);

    if (!result.success) {
      return {
        success: false,
        error: fromZodError(result.error),
      };
    }

    return { success: true, data: result.data };
  }
}
