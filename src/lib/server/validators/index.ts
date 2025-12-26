import { EntityType } from "$lib/sm-types";
import { TextInputStyle } from "discord-api-types/v10";
import { z } from "zod";
import { type ValidationError, fromZodError } from "zod-validation-error";

type ValidationRes<V extends z.ZodType> =
  | { success: true; data: z.core.output<V> }
  | { success: false; error: string };

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
      if (err instanceof z.ZodError) {
        return {
          success: false,
          error: fromZodError(err).toString(),
        };
      }
      throw err;
    }
  }

  static toHumanError(eror: ValidationError) {
    const { details } = eror;
    const errors: string[] = [];

    for (let err of details) {
      const pathLabel = err.path.length > 0 ? err.path.join(".") : "root";
      errors.push(`${pathLabel}: ${err.message}`);
    }

    return errors.join("\n");
  }
}

export const SnowflakePredicate = z.string().regex(/^\d{15,25}$/i);

export const PartialEmojiPredicate = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    animated: z.boolean().optional(),
  })
  .refine((data) => data.id || data.name, { error: "Either id or name must be provided" });

export const EntityPredicate = <T extends EntityType>(typePredicate: T) =>
  z.object({
    typ: z.literal(typePredicate),
    id: SnowflakePredicate,
  });

export const UserEntityPredicate = EntityPredicate(EntityType.user);
export const RoleEntityPredicate = EntityPredicate(EntityType.role);

export const MentionableEntityPredicate = z.union([UserEntityPredicate, RoleEntityPredicate]);
// ? Maybe add another predicate for guild?

export const CustomModalFieldSchema = z.object({
  position: z.number().int().min(1).max(5),
  label: z.string().min(1).max(100),
  placeholder: z.string().min(0).max(100).optional(),
  _required: z.boolean().default(false),
  style: z.enum(TextInputStyle).default(TextInputStyle.Short),
  minL: z.int().min(0).max(4000).optional(),
  maxL: z.int().min(1).max(4000).optional(),
});

export const APIPausedUntilSchema = z.object({
  value: z.boolean(),
  date: z.iso.datetime({ offset: true, local: true, abort: true }).nullable(),
});
