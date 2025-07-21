import { z, ZodError } from "zod";
import { type ValidationError } from "zod-validation-error";
import { fromZodError } from "zod-validation-error/v4";

type ValidationRes<V extends z.ZodType> =
  | { success: true; data: z.core.output<V> }
  | { success: false; error: ValidationError };

export class ZodValidator<V extends z.ZodType> {
  constructor(private validator: V) {}

  public validate(value: unknown): ValidationRes<V> {
    try {
      const result = this.validator.parse(value);

      return {
        success: true,
        data: result,
      };
    } catch (err) {
      return {
        success: false,
        // ? as of 2025-07-16 the fromError function isn't working and has a critical bug.
        error: fromZodError(err as ZodError) as ValidationError,
      };
    }
  }
}
