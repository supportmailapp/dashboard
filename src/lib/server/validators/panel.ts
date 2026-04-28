import * as z from "zod";
import { ButtonStyle, ComponentType, SeparatorSpacingSize } from "discord-api-types/v10";
import { SnowflakeUtil } from "$lib/utils";

// Base schemas
const ObjectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
const SMMediaItemSchema = z.object({
  url: z.url(),
  description: z.string().optional(),
  spoiler: z.boolean().default(false),
});

const SMThumbnailComponentSchema = SMMediaItemSchema.extend({
  type: z.literal(ComponentType.Thumbnail),
});

const SMCustomActionSchema = z.enum(["ticket:create", "reply", "link"]);

// Button schemas
const SMActionRowButtonSchema = z.xor([
  z.object({
    action: z.literal("link"),
    type: z.literal(ComponentType.Button),
    style: z.literal(ButtonStyle.Link),
    url: z.url(),
    label: z.string().optional(),
    emoji: z.string().optional(),
    disabled: z.boolean().optional(),
  }),
  z
    .object({
      action: z.enum(["ticket:create", "reply"]),
      type: z.literal(ComponentType.Button),
      style: z.union([
        z.literal(ButtonStyle.Primary),
        z.literal(ButtonStyle.Secondary),
        z.literal(ButtonStyle.Success),
        z.literal(ButtonStyle.Danger),
      ]),
      custom_id: z.optional(z.xor([ObjectIdSchema, z.literal("")])),
      label: z.string().optional(),
      emoji: z.string().optional(),
      disabled: z.boolean().optional(),
    })
    .refine(
      (data) => !!data.label?.length || !!data.emoji?.length,
      "Button must have at least a label or an emoji",
    ),
]);

// Select schemas
const SMSelectOptionSchema = z
  .object({
    _id: z.string().optional().default(SnowflakeUtil.generate().toString()),
    action: z.enum(["ticket:create", "reply"]),
    value: z.pipe(
      z.xor([ObjectIdSchema, z.literal("")]),
      z.transform((val) => val || undefined),
    ), // start a ticket is allowed with empty value - category id is optional here
    label: z.string(),
    emoji: z
      .string()
      .optional()
      .transform((val) => val || undefined),
    description: z
      .string()
      .optional()
      .transform((val) => val || undefined),
  })
  .refine(
    (data) => (data.action === "ticket:create" ? true : !!data.value?.length),
    "Value must be a valid ObjectId when action is not 'ticket:create'",
  );

const SMSelectSchema = z.object({
  type: z.literal(ComponentType.StringSelect),
  custom_id: z.literal("panelSelect"),
  options: SMSelectOptionSchema.array()
    .min(1, "At least one option is required")
    .max(25, "A maximum of 25 options are allowed"),
  placeholder: z
    .string()
    .optional()
    .transform((val) => val || undefined),
});

// Component schemas
const TextDisplayComponentSchema = z.object({
  type: z.literal(ComponentType.TextDisplay),
  content: z.string().min(1, "Content cannot be empty").max(2000, "Content cannot exceed 2000 characters"),
});

const SMSectionComponentSchema = z.object({
  type: z.literal(ComponentType.Section),
  components: TextDisplayComponentSchema.array()
    .min(1, "At least one component is required")
    .max(3, "A maximum of 3 components are allowed"),
  accessory: z.union(
    [SMActionRowButtonSchema, SMThumbnailComponentSchema],
    "Accessory must be either a button or a thumbnail",
  ),
});

const SMMediaGalleryComponentSchema = z.object({
  type: z.literal(ComponentType.MediaGallery),
  items: SMMediaItemSchema.array()
    .min(1, "At least one item is required")
    .max(10, "A maximum of 10 items are allowed"),
});

const SMComponentInActionRowSchema = z.union([SMActionRowButtonSchema, SMSelectSchema]);

const SMActionRowComponentSchema = z.object({
  type: z.literal(ComponentType.ActionRow),
  components: SMComponentInActionRowSchema.array()
    .min(1, "At least one component is required")
    .max(5, "A maximum of 5 components are allowed")
    .refine((childs) => {
      const hasSelect = childs.some((c) => c.type === ComponentType.StringSelect);
      if (hasSelect) {
        return childs.length === 1;
      }
      return true;
    }),
});

const SeparatorComponentSchema = z.object({
  type: z.literal(ComponentType.Separator),
  divider: z.boolean().default(true),
  spacing: z.enum(SeparatorSpacingSize).default(SeparatorSpacingSize.Small),
});

const SMComponentInContainerSchema = z.lazy(() =>
  z.union([
    SMMediaGalleryComponentSchema,
    SMSectionComponentSchema,
    SeparatorComponentSchema,
    TextDisplayComponentSchema,
    SMActionRowComponentSchema,
  ]),
);

const SMContainerComponentSchema = z.object({
  type: z.literal(ComponentType.Container),
  components: z
    .array(SMComponentInContainerSchema)
    .min(1, "At least one component is required")
    .max(39, "Total components cannot exceed 40"), // container + 39 = 40 max components in a message
});

const SMTopLevelMessageComponentSchema = z.union([
  SMContainerComponentSchema,
  SMMediaGalleryComponentSchema,
  SMSectionComponentSchema,
  SeparatorComponentSchema,
  TextDisplayComponentSchema,
  SMActionRowComponentSchema,
]);

// Panel schema

export {
  SMMediaItemSchema,
  SMThumbnailComponentSchema,
  SMCustomActionSchema,
  SMActionRowButtonSchema,
  SMSelectOptionSchema,
  SMSelectSchema,
  SMSectionComponentSchema,
  SMMediaGalleryComponentSchema,
  SMComponentInActionRowSchema,
  SMActionRowComponentSchema,
  SeparatorComponentSchema,
  TextDisplayComponentSchema,
  SMComponentInContainerSchema,
  SMContainerComponentSchema,
  SMTopLevelMessageComponentSchema,
};
