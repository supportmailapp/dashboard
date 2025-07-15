import { z } from "zod";
import { fromError, type ValidationError } from "zod-validation-error";

type ValidationRes<V extends z.ZodType> =
  | { success: true; data: z.core.output<V> }
  | { success: false; error: ValidationError };

export class MyValidator<V extends z.ZodType> {
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
        error: fromError(err),
      };
    }
  }
}
