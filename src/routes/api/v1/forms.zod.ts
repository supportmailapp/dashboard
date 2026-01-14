import { SnowflakeUtil, zem } from "$lib/utils";
import { ComponentType } from "discord-api-types/v10";
import { z } from "zod";

// We can't have a circular import from the assertions file
// So we redefine SnowflakePredicate here
const SnowflakePredicate = z.string().regex(/^\d{17,23}$/, {
  error: "Invalid Snowflake format",
});

export const StringSelectOptionSchema = z.object({
  id: SnowflakePredicate.default(() => SnowflakeUtil.generate().toString()),
  label: z
    .string()
    .trim()
    .min(1, zem("Label must be at least 1 character long"))
    .max(45, zem("Label must be at most 45 characters long")),
  value: z
    .string()
    .trim()
    .min(1, zem("Value must be at least 1 character long"))
    .max(100, zem("Value must be at most 100 characters long")),
  description: z.string().trim().max(100, zem("Description must be at most 100 characters long")).optional(),
  emoji: z.string().trim().max(100, zem("Emoji must be at most 100 characters long")).optional(),
  default: z.boolean().default(false).optional(),
});

const BaseFormComponentSchema = z.object({
  id: SnowflakePredicate.default(() => SnowflakeUtil.generate().toString()),
  _id: z.string().trim().optional(),
  required: z.boolean().default(false).optional(),
  local: z.literal(true, zem("Local must be true (Contact developer, this should not happen)")).optional(), // Used client-side only
});

// Text Display
export const TextDisplayComponentSchema = BaseFormComponentSchema.extend({
  type: z.literal(ComponentType.TextDisplay),
  content: z
    .string()
    .trim()
    .min(1, zem("Content must be at least 1 character long"))
    .max(4000, zem("Content must be at most 4000 characters long")),
});

const BaseFormComponentWithDescriptionSchema = (placeholderMaxLength = 150) =>
  BaseFormComponentSchema.extend({
    label: z
      .string()
      .trim()
      .min(1, zem("Label must be at least 1 character long"))
      .max(45, zem("Label must be at most 45 characters long")),
    description: z
      .string()
      .trim()
      .max(100, zem("Description must be at most 100 characters long"))
      .optional(),
    placeholder: z
      .string()
      .trim()
      .max(placeholderMaxLength, zem(`Placeholder must be at most ${placeholderMaxLength} characters long`))
      .optional(),
  });

// Text Input
export const TextInputComponentSchema = BaseFormComponentWithDescriptionSchema(100).safeExtend({
  type: z.literal(ComponentType.TextInput),
  style: z.union([z.literal(1), z.literal(2)]).default(1), // Changed from z.enum({ Short: 1, Paragraph: 2 })
  minLength: z
    .int32()
    .min(0, zem("Min length must be at least 0"))
    .max(4000, zem("Min length must be at most 4000"))
    .optional(),
  maxLength: z
    .int32()
    .min(1, zem("Max length must be at least 1"))
    .max(4000, zem("Max length must be at most 4000"))
    .optional(),
  defaultValue: z
    .string()
    .trim()
    .min(0, zem("Default value must be at least 0 characters long"))
    .max(4000, zem("Default value must be at most 4000 characters long"))
    .optional(),
});

// Select
export const StringSelectComponentSchema = BaseFormComponentWithDescriptionSchema(150)
  .safeExtend({
    type: z.literal(ComponentType.StringSelect),
    minValues: z
      .int()
      .nonnegative(zem("Min values must be non-negative"))
      .max(25, zem("Min values must be at most 25"))
      .optional(),
    maxValues: z
      .int()
      .min(1, zem("Max values must be at least 1"))
      .max(25, zem("Max values must be at most 25"))
      .optional(),
    options: z
      .array(StringSelectOptionSchema)
      .min(1, zem("At least one option is required"))
      .max(25, zem("A maximum of 25 options are allowed")),
  })
  .refine(
    (data) => (data.minValues ?? 1) <= (data.maxValues ?? 25),
    zem("Min values must be less than or equal to max values"),
  )
  .refine(
    (data) =>
      (data.minValues ?? 1) <= (data.options?.length || 25) ||
      (data.maxValues ?? 25) >= (data.options?.length || 25),
    zem("Min values or max values must be within the number of options"),
  );

export const FileUploadComponentSchema = BaseFormComponentSchema.safeExtend({
  type: z.literal(ComponentType.FileUpload),
  label: z
    .string()
    .trim()
    .min(1, zem("Label must be at least 1 character long"))
    .max(45, zem("Label must be at most 45 characters long")),
  description: z.string().trim().max(100, zem("Description must be at most 100 characters long")).optional(),
  messageLabel: z
    .string()
    .trim()
    .max(100, zem("Message label must be at most 100 characters long"))
    .optional(),
  minValues: z
    .int32()
    .min(0, zem("Min values must be at least 0"))
    .max(10, zem("Min values must be at most 10"))
    .default(1),
  maxValues: z
    .int32()
    .min(1, zem("Max values must be at least 1"))
    .max(10, zem("Max values must be at most 10"))
    .default(1),
}).refine(
  (data) => (data.minValues ?? 1) <= (data.maxValues ?? 10),
  zem("minValues must be less than or equal to maxValues"),
);

export const NormalFormComponentSchema = z.discriminatedUnion("type", [
  TextDisplayComponentSchema,
  TextInputComponentSchema,
  StringSelectComponentSchema,
  FileUploadComponentSchema,
]);

export const FeedbackComponentSchema = z.discriminatedUnion("type", [
  TextDisplayComponentSchema,
  TextInputComponentSchema,
  StringSelectComponentSchema,
]);

const AnyFormComponentSchema = z.union([NormalFormComponentSchema, FeedbackComponentSchema]);
type AnyFormComponent = z.infer<typeof AnyFormComponentSchema>;

export const FormComponentsSchema = <T extends AnyFormComponent>(schema: z.ZodType<T>) =>
  z
    .array(schema)
    .min(0, "At least one form component is required")
    .max(5, "A maximum of 5 form components are allowed")
    .refine((fields) => {
      const ids = fields.map((field) => field.id);
      return ids.length === new Set(ids).size;
    }, zem("IDs must be unique. How did we get here?"))
    .default([])
    .transform((fields) => {
      fields.forEach((field) => {
        // remove _id from fields if local is true
        if (field.local === true && "_id" in field) {
          delete field._id;
        }
        //Set id field if local is true or id is missing
        if (field.local === true || !field.id) {
          delete (field as any).id;
          field.id = SnowflakeUtil.generate().toString();
        }
      });
      return fields;
    });
