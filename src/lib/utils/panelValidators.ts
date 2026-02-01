import { z } from "zod/mini";
import { ButtonStyle, ComponentType, SeparatorSpacingSize } from "discord-api-types/v10";
import { SnowflakeUtil } from "$lib/utils";

// Base schemas
const SnowflakeSchema = z.string().check(z.regex(/^\d{17,23}$/));
const ObjectIdSchema = z.string().check(z.regex(/^[a-f\d]{24}$/i));
const SMMediaItemSchema = z.object({
  url: z.url(),
  description: z.optional(z.string()),
  spoiler: z._default(z.boolean(), false),
});

const SMThumbnailComponentSchema = z.extend(SMMediaItemSchema, {
  type: z.literal(ComponentType.Thumbnail),
});

const SMCustomActionSchema = z.enum(["ticket:create", "reply", "link"]);

// Button schemas
const SMActionRowButtonSchema = z.union([
  z.object({
    action: z.literal("link"),
    type: z.literal(ComponentType.Button),
    style: z.literal(ButtonStyle.Link),
    url: z.url(),
    label: z.optional(z.string()),
    emoji: z.optional(z.string()),
    disabled: z.optional(z.boolean()),
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
      custom_id: ObjectIdSchema,
      label: z.optional(z.string()),
      emoji: z.optional(z.string()),
      disabled: z.optional(z.boolean()),
    })
    .check(
      z.refine(
        (data) => !!data.label?.length || !!data.emoji?.length,
        "Button must have at least a label or an emoji",
      ),
    ),
]);

// Select schemas
const SMSelectOptionSchema = z.object({
  _id: z._default(z.optional(SnowflakeSchema), SnowflakeUtil.generate().toString()),
  action: z.enum(["ticket:create", "reply"]),
  value: ObjectIdSchema,
  label: z.string(),
  emoji: z.pipe(
    z.optional(z.string()),
    z.transform((val) => val || undefined),
  ),
  description: z.pipe(
    z.optional(z.string()),
    z.transform((val) => val || undefined),
  ),
});

const ClientSMSelectOptionSchema = z.extend(SMSelectOptionSchema, {
  _id: ObjectIdSchema,
  local: z.optional(z.boolean()),
});

const SMSelectSchema = z.object({
  type: z.literal(ComponentType.StringSelect),
  custom_id: z.literal("panelSelect"),
  options: z.array(SMSelectOptionSchema).check(z.minLength(1), z.maxLength(25)),
  placeholder: z.pipe(
    z.optional(z.string()),
    z.transform((val) => val || undefined),
  ),
});

const ClientSMSelectSchema = z.extend(SMSelectSchema, {
  options: z.array(ClientSMSelectOptionSchema),
});

// Component schemas
const TextDisplayComponentSchema = z.object({
  type: z.literal(ComponentType.TextDisplay),
  content: z.string().check(z.minLength(1), z.maxLength(2000)),
});

const SMSectionComponentSchema = z.object({
  type: z.literal(ComponentType.Section),
  components: z.array(TextDisplayComponentSchema).check(z.minLength(1), z.maxLength(3)),
  accessory: z.optional(z.union([SMActionRowButtonSchema, SMThumbnailComponentSchema])),
});

const SMMediaGalleryComponentSchema = z.object({
  type: z.literal(ComponentType.MediaGallery),
  items: z.array(SMMediaItemSchema).check(z.minLength(1), z.maxLength(10)),
});

const SMComponentInActionRowSchema = z.union([SMActionRowButtonSchema, SMSelectSchema]);

const SMActionRowComponentSchema = z.object({
  type: z.literal(ComponentType.ActionRow),
  components: z.array(SMComponentInActionRowSchema).check(
    z.minLength(1),
    z.maxLength(5),
    z.refine((childs) => {
      const hasSelect = childs.some((c) => c.type === ComponentType.StringSelect);
      if (hasSelect) {
        return childs.length === 1;
      }
      return true;
    }),
  ),
});

const SeparatorComponentSchema = z.object({
  type: z.literal(ComponentType.Separator),
  divider: z._default(z.boolean(), true),
  spacing: z._default(z.enum(SeparatorSpacingSize), SeparatorSpacingSize.Small),
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
  components: z.array(SMComponentInContainerSchema).check(z.minLength(1)),
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
  ClientSMSelectOptionSchema,
  SMSelectSchema,
  ClientSMSelectSchema,
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
