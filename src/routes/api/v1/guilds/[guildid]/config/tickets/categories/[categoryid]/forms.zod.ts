import { SnowflakeUtil } from "$lib/utils";
import { SnowflakePredicate } from "$v1Api/assertions";
import { ComponentType } from "discord-api-types/v10";
import { z } from "zod";

export const StringSelectOptionSchema = z.object({
  id: SnowflakePredicate.default(() => SnowflakeUtil.generate().toString()),
  label: z.string().trim().min(1).max(45),
  value: z.string().trim().min(1).max(100),
  description: z.string().trim().max(100).optional(),
  emoji: z.string().trim().max(100).optional(),
  default: z.boolean().default(false).optional(),
});

const BaseFormComponentSchema = z.object({
  id: SnowflakePredicate.default(() => SnowflakeUtil.generate().toString()),
  _id: z.string().trim().optional(),
  required: z.boolean().default(false).optional(),
  local: z.literal(true).optional(), // Used client-side only
});

// Text Display
export const TextDisplayComponentSchema = BaseFormComponentSchema.extend({
  type: z.literal(ComponentType.TextDisplay),
  content: z.string().trim().min(1).max(4000),
});

const BaseFormComponentWithDescriptionSchema = (placeholderMaxLength = 150) =>
  BaseFormComponentSchema.extend({
    label: z.string().trim().min(1).max(45),
    description: z.string().trim().max(100).optional(),
    placeholder: z.string().trim().max(placeholderMaxLength).optional(),
  });

// Text Input
export const TextInputComponentSchema = BaseFormComponentWithDescriptionSchema(100).safeExtend({
  type: z.literal(ComponentType.TextInput),
  style: z.union([z.literal(1), z.literal(2)]).default(1), // Changed from z.enum({ Short: 1, Paragraph: 2 })
  minLength: z.int32().min(0).max(4000).optional(),
  maxLength: z.int32().min(1).max(4000).optional(),
  defaultValue: z.string().trim().min(0).max(4000).optional(),
});

// Select
export const StringSelectComponentSchema = BaseFormComponentWithDescriptionSchema(150)
  .safeExtend({
    type: z.literal(ComponentType.StringSelect),
    minValues: z.int32().min(0).max(25).optional(),
    maxValues: z.int32().min(1).max(25).optional(),
    options: z.array(StringSelectOptionSchema).min(1).max(25),
  })
  .refine((data) => (data.minValues ?? 1) <= (data.maxValues ?? 25), {
    error: "minValues must be less than or equal to maxValues",
  })
  .refine(
    (data) =>
      (data.minValues ?? 1) <= (data.options?.length || 25) ||
      (data.maxValues ?? 25) >= (data.options?.length || 25),
    {
      error: "minValues or maxValues must be within the number of options",
    },
  );

export const FileUploadComponentSchema = BaseFormComponentSchema.safeExtend({
  type: z.literal(ComponentType.File),
  label: z.string().trim().min(1).max(45),
  description: z.string().trim().max(100).optional(),
  messageLabel: z.string().trim().max(100).optional(),
  minValues: z.int32().min(1).max(10).default(1),
  maxValues: z.int32().min(1).max(10).default(1),
}).refine((data) => (data.minValues ?? 1) <= (data.maxValues ?? 10), {
  error: "minValues must be less than or equal to maxValues",
});

export const FormComponentSchema = z.discriminatedUnion("type", [
  TextDisplayComponentSchema,
  TextInputComponentSchema,
  StringSelectComponentSchema,
  FileUploadComponentSchema,
]);

export const FormComponentsSchema = z
  .array(FormComponentSchema)
  .min(0)
  .max(5)
  .refine(
    (fields) => {
      const ids = fields.map((field) => field.id);
      return ids.length === new Set(ids).size;
    },
    { error: "IDs must be unique. How did we get here?" },
  )
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
