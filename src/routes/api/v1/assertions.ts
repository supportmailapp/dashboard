import { EntityType } from "$lib/sm-types/src";
import z from "zod";

export * from "./forms.zod.js";
import { FeedbackComponentSchema, FormComponentsSchema } from "./forms.zod.js";
import { zem } from "$lib/utils.js";

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
  _id: z.string(),
  guildId: SnowflakePredicate,
  enabled: z.boolean(),
  index: z.int().nonnegative(zem("Index must be non-negative")),
  label: z
    .string()
    .min(3, zem("Label must be at least 3 characters long"))
    .max(45, zem("Label must be at most 45 characters long")),
  emoji: PartialEmoji.optional(),
  tag: SnowflakePredicate.optional(),
  pings: z.array(MentionableEntity).max(100, zem("A maximum of 100 pings are allowed")).optional(),
  components: FormComponentsSchema(FeedbackComponentSchema),
  customMessageId: z.string(),
});

export type TicketCategory = z.infer<typeof TicketCategorySchema>;
