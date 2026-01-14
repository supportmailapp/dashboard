import { EntityType } from "$lib/sm-types";
import z from "zod";
export * from "./forms.zod.js";
import { FeedbackComponentSchema, FormComponentsSchema, NormalFormComponentSchema } from "./forms.zod.js";
import { arrayIsDistinct, zem } from "$lib/utils.js";
import { PermissionFlagsBits } from "$lib/utils/permissions.js";

export const ObjectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, zem("Invalid ObjectId format"));

export const overview = z.object({
  language: z.union([z.literal("en"), z.literal("de"), z.literal("fr")]),
});

export type OverviewConfig = z.infer<typeof overview>;

export const SnowflakePredicate = z.string().regex(/^\d{17,23}$/, zem("Invalid Snowflake format"));

export const Entity = <T extends EntityType>(type: z.ZodLiteral<T>) =>
  z.object({
    typ: type,
    id: SnowflakePredicate,
  });

export const UserEntity = Entity(z.literal(EntityType.user));
export const GuildEntity = Entity(z.literal(EntityType.guild));
export const RoleEntity = Entity(z.literal(EntityType.role));

export const MentionableEntity = z.union([UserEntity, RoleEntity]);
export const AnyEntity = z.union([UserEntity, GuildEntity, RoleEntity]);

export type UserEntity = z.infer<typeof UserEntity>;
export type GuildEntity = z.infer<typeof GuildEntity>;
export type RoleEntity = z.infer<typeof RoleEntity>;
export type MentionableEntity = z.infer<typeof MentionableEntity>;
export type AnyEntity = z.infer<typeof AnyEntity>;

export const PartialEmoji = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    animated: z.boolean().optional(),
  })
  .refine((data) => data.id || data.name, { error: "Either id or name must be provided" });

export type PartialEmoji = z.infer<typeof PartialEmoji>;

export const APIPausedUntilSchema = z.object({
  value: z.boolean(),
  date: z.iso.datetime({ offset: true, local: true, abort: true, error: "Invalid date format" }).nullable(),
});

export type APIPausedUntil = z.infer<typeof APIPausedUntilSchema>;

export const FeedbackConfigSchema = z.object({
  guildId: SnowflakePredicate,
  channelId: SnowflakePredicate.optional(),
  isEnabled: z.boolean().default(false),
  thankYou: z.string().max(4000, zem("Thank you message must be at most 4000 characters long")).optional(),
  components: FormComponentsSchema(FeedbackComponentSchema),
});

export type FeedbackConfig = z.infer<typeof FeedbackConfigSchema>;

export const TicketCategorySchema = z.object({
  _id: ObjectIdSchema.optional(),
  local: z.literal(true).optional(),
  guildId: SnowflakePredicate,
  enabled: z.boolean(),
  index: z.int().nonnegative(zem("Index must be non-negative")),
  label: z
    .string()
    .min(3, zem("Label must be at least 3 characters long"))
    .max(45, zem("Label must be at most 45 characters long")),
  emoji: z.string().trim().optional(), // technically we could also validate this but for the sake of simplicity we allow any string here
  tag: SnowflakePredicate.optional(),
  pings: z
    .array(MentionableEntity)
    .max(100, zem("A maximum of 100 pings are allowed"))
    .refine((p) => {
      const uniqueCombos = new Set<string>(p.map((ent) => `${ent.typ}-${ent.id}`));
      return uniqueCombos.size === p.length;
    }, zem("Duplicate mentionable entities found in pings"))
    .optional(),
  components: FormComponentsSchema(NormalFormComponentSchema),
  creationMessage: z
    .string()
    .max(2000, zem("Creation message must be at most 2000 characters long"))
    .nullable()
    .default(null),
  closeMessage: z
    .string()
    .max(2000, zem("Close message must be at most 2000 characters long"))
    .nullable()
    .default(null),
});

export const PartialTicketCategorySchema = TicketCategorySchema.pick({
  _id: true,
  local: true,
  label: true,
  guildId: true,
  index: true,
});

export const TicketCategoriesPUTSchema = z.preprocess(
  (obj) => {
    // ensure index is at least 0 and _id is unset if local is true
    if (Array.isArray(obj)) {
      return obj.map((item) => {
        if (typeof item === "object" && item !== null) {
          const newObj = { ...item };
          if ("index" in newObj && typeof newObj.index === "number") {
            newObj.index = Math.max(0, newObj.index || 0);
          }
          if ("local" in newObj && newObj.local === true && "_id" in newObj) {
            delete newObj._id;
          }
          return newObj;
        }
        return item;
      });
    }
    return obj;
  },
  // ensure unqiue _ids
  PartialTicketCategorySchema.array()
    .max(10, zem("A maximum of 10 ticket categories are allowed"))
    .refine(
      (cats) => cats.length === new Set(cats.map((c) => c._id)).size,
      zem("Duplicate _id values found in ticket categories"),
    ),
);

export type PartialTicketCategory = z.infer<typeof PartialTicketCategorySchema>;
export type TicketCategory = z.infer<typeof TicketCategorySchema>;

export const TagPutSchema = z.preprocess(
  (obj) => {
    // delete _id if local is true
    if (typeof obj === "object" && obj !== null && "local" in obj && (obj as any).local === true) {
      const newObj = { ...(obj as any) };
      delete newObj._id;
      return newObj;
    }
    return obj;
  },
  z
    .object({
      _id: ObjectIdSchema.optional(),
      local: z.literal(true).optional(),
      delete: z.literal(true).optional(),
      guildId: SnowflakePredicate,
      name: z
        .string()
        .trim()
        .min(2, zem("Name must be at least 2 characters long"))
        .max(50, zem("Name must be at most 100 characters long")),
      content: z.string().max(2000, zem("Content must be at most 2000 characters long")),
      onlyTickets: z.boolean().default(false),
      createdAt: z.string().optional(), // we remove this field later anyways
      updatedAt: z.string().optional(), // we remove this field later anyways
    })
    .transform(({ createdAt, updatedAt, ...rest }) => rest),
);

export const GetTagSchemaForGuild = (guildId: string) =>
  z
    .array(
      TagPutSchema.refine((tag) => tag.guildId === guildId, zem("guildId in tag must match URL parameter")),
    )
    .max(100, zem("A maximum of 100 tags are allowed per server"));

export type TagPut = z.infer<typeof TagPutSchema>;

export const CommandConfigSchema = z.object({
  id: SnowflakePredicate,
  commandPath: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^([-_'\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32})(\/[-_'\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}){0,2}$/iu,
      zem("Invalid command path format"),
    ),
  guildId: SnowflakePredicate.nullable(), // null for global commands, currently for all!
  channels: z
    .array(SnowflakePredicate)
    .max(100, zem("A maximum of 100 channels are allowed"))
    .refine((c) => arrayIsDistinct(c), zem("Duplicate channels are not allowed"))
    .default([]),
  roles: z
    .array(SnowflakePredicate)
    .max(100, zem("A maximum of 100 roles are allowed"))
    .refine((r) => arrayIsDistinct(r), zem("Duplicate roles are not allowed"))
    .default([]),
  users: z
    .array(SnowflakePredicate)
    .max(100, zem("A maximum of 100 users are allowed"))
    .refine((u) => arrayIsDistinct(u), zem("Duplicate users are not allowed"))
    .default([]),
  permissions: z
    .string()
    .trim()
    .refine((val) => /^[0-9]+$/.test(val), zem("Permissions must be a valid numeric string"))
    .transform((val) => BigInt(val))
    .refine((val) => val >= BigInt(0), zem("Permissions must be non-negative"))
    .refine(
      (val) => val <= BigInt(PermissionFlagsBits.BypassSlowmode),
      zem("Permissions exceed maximum allowed value"),
    )
    // if no permissions are set, default to ManageGuild
    .default(PermissionFlagsBits.ManageGuild)
    .transform((val) => (val === BigInt(0) ? BigInt(PermissionFlagsBits.ManageGuild) : val)),
});

export const CommandConfigPutSchema = CommandConfigSchema.array();

export type CommandConfigPut = z.infer<typeof CommandConfigPutSchema>;

export const ResetTicketsSchema = z
  .array(z.enum(["forum", "categories", "feedback", "anonym", "other"]))
  .refine((i) => arrayIsDistinct(i), zem("Duplicate reset options are not allowed"))
  .min(1, zem("At least one reset option must be selected"))
  .transform((arr) => new Set(arr));

export type ResetTickets = z.infer<typeof ResetTicketsSchema>;
