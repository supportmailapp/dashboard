import { EntityType } from "$lib/sm-types/src";
import { TextInputStyle } from "discord-api-types/v10";
import z from "zod";

export const overview = z.object({
  language: z.union([z.literal("en"), z.literal("de"), z.literal("fr")]),
});

export type OverviewConfig = z.infer<typeof overview>;

export const SnowflakePredicate = z.string().regex(/^\d{17,23}$/, {
  error: "Invalid Snowflake format",
});

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

export const CustomModalFieldSchema = z.object({
  position: z.number().int().min(1).max(5),
  label: z.string().min(1).max(100),
  placeholder: z.string().min(0).max(100).optional(),
  _required: z.boolean().default(false),
  style: z.enum(TextInputStyle).default(TextInputStyle.Short),
  minL: z.int().min(0).max(4000).optional(),
  maxL: z.int().min(1).max(4000).optional(),
});

export type CustomModalField = z.infer<typeof CustomModalFieldSchema>;

export const APIPausedUntilSchema = z.object({
  value: z.boolean(),
  date: z.iso.datetime({ offset: true, local: true, abort: true }).nullable(),
});

export type APIPausedUntil = z.infer<typeof APIPausedUntilSchema>;
