// From discord-api-types/v10:

import { toTitleCase } from "$lib/utils";

/**
 * @see {@link https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags}
 *
 * These flags are exported as `BigInt`s and NOT numbers. Wrapping them in `Number()`
 * may cause issues, try to use BigInts as much as possible or modules that can
 * replicate them in some way
 */
export const PermissionFlagsBits = {
  /**
   * Allows creation of instant invites
   *
   * Applies to channel types: Text, Voice, Stage
   */
  CreateInstantInvite: BigInt(1) << BigInt(0),
  /**
   * Allows kicking members
   */

  KickMembers: BigInt(1) << BigInt(1),
  /**
   * Allows banning members
   */
  BanMembers: BigInt(1) << BigInt(2),
  /**
   * Allows all permissions and bypasses channel permission overwrites
   */
  Administrator: BigInt(1) << BigInt(3),
  /**
   * Allows management and editing of channels
   *
   * Applies to channel types: Text, Voice, Stage
   */
  ManageChannels: BigInt(1) << BigInt(4),
  /**
   * Allows management and editing of the guild
   */
  ManageGuild: BigInt(1) << BigInt(5),
  /**
   * Allows for the addition of reactions to messages
   *
   * Applies to channel types: Text, Voice, Stage
   */
  AddReactions: BigInt(1) << BigInt(6),
  /**
   * Allows for viewing of audit logs
   */
  ViewAuditLog: BigInt(1) << BigInt(7),
  /**
   * Allows for using priority speaker in a voice channel
   *
   * Applies to channel types: Voice
   */
  PrioritySpeaker: BigInt(1) << BigInt(8),
  /**
   * Allows the user to go live
   *
   * Applies to channel types: Voice, Stage
   */
  Stream: BigInt(1) << BigInt(9),
  /**
   * Allows guild members to view a channel, which includes reading messages in text channels and joining voice channels
   *
   * Applies to channel types: Text, Voice, Stage
   */
  ViewChannel: BigInt(1) << BigInt(10),
  /**
   * Allows for sending messages in a channel and creating threads in a forum
   * (does not allow sending messages in threads)
   *
   * Applies to channel types: Text, Voice, Stage
   */
  SendMessages: BigInt(1) << BigInt(11),
  /**
   * Allows for sending of `/tts` messages
   *
   * Applies to channel types: Text, Voice, Stage
   */
  SendTTSMessages: BigInt(1) << BigInt(12),
  /**
   * Allows for deletion of other users messages
   *
   * Applies to channel types: Text, Voice, Stage
   */
  ManageMessages: BigInt(1) << BigInt(13),
  /**
   * Links sent by users with this permission will be auto-embedded
   *
   * Applies to channel types: Text, Voice, Stage
   */
  EmbedLinks: BigInt(1) << BigInt(14),
  /**
   * Allows for uploading images and files
   *
   * Applies to channel types: Text, Voice, Stage
   */
  AttachFiles: BigInt(1) << BigInt(15),
  /**
   * Allows for reading of message history
   *
   * Applies to channel types: Text, Voice, Stage
   */
  ReadMessageHistory: BigInt(1) << BigInt(16),
  /**
   * Allows for using the `@everyone` tag to notify all users in a channel,
   * and the `@here` tag to notify all online users in a channel
   *
   * Applies to channel types: Text, Voice, Stage
   */
  MentionEveryone: BigInt(1) << BigInt(17),
  /**
   * Allows the usage of custom emojis from other servers
   *
   * Applies to channel types: Text, Voice, Stage
   */
  UseExternalEmojis: BigInt(1) << BigInt(18),
  /**
   * Allows for viewing guild insights
   */
  ViewGuildInsights: BigInt(1) << BigInt(19),
  /**
   * Allows for joining of a voice channel
   *
   * Applies to channel types: Voice, Stage
   */
  Connect: BigInt(1) << BigInt(20),
  /**
   * Allows for speaking in a voice channel
   *
   * Applies to channel types: Voice
   */
  Speak: BigInt(1) << BigInt(21),
  /**
   * Allows for muting members in a voice channel
   *
   * Applies to channel types: Voice, Stage
   */
  MuteMembers: BigInt(1) << BigInt(22),
  /**
   * Allows for deafening of members in a voice channel
   *
   * Applies to channel types: Voice
   */
  DeafenMembers: BigInt(1) << BigInt(23),
  /**
   * Allows for moving of members between voice channels
   *
   * Applies to channel types: Voice, Stage
   */
  MoveMembers: BigInt(1) << BigInt(24),
  /**
   * Allows for using voice-activity-detection in a voice channel
   *
   * Applies to channel types: Voice
   */
  UseVAD: BigInt(1) << BigInt(25),
  /**
   * Allows for modification of own nickname
   */
  ChangeNickname: BigInt(1) << BigInt(26),
  /**
   * Allows for modification of other users nicknames
   */
  ManageNicknames: BigInt(1) << BigInt(27),
  /**
   * Allows management and editing of roles
   *
   * Applies to channel types: Text, Voice, Stage
   */
  ManageRoles: BigInt(1) << BigInt(28),
  /**
   * Allows management and editing of webhooks
   *
   * Applies to channel types: Text, Voice, Stage
   */
  ManageWebhooks: BigInt(1) << BigInt(29),
  /**
   * Allows for editing and deleting emojis, stickers, and soundboard sounds created by all users
   */
  ManageGuildExpressions: BigInt(1) << BigInt(30),
  /**
   * Allows members to use application commands, including slash commands and context menu commands
   *
   * Applies to channel types: Text, Voice, Stage
   */
  UseApplicationCommands: BigInt(1) << BigInt(31),
  /**
   * Allows for requesting to speak in stage channels
   *
   * Applies to channel types: Stage
   */
  RequestToSpeak: BigInt(1) << BigInt(32),
  /**
   * Allows for editing and deleting scheduled events created by all users
   *
   * Applies to channel types: Voice, Stage
   */
  ManageEvents: BigInt(1) << BigInt(33),
  /**
   * Allows for deleting and archiving threads, and viewing all private threads
   *
   * Applies to channel types: Text
   */
  ManageThreads: BigInt(1) << BigInt(34),
  /**
   * Allows for creating public and announcement threads
   *
   * Applies to channel types: Text
   */
  CreatePublicThreads: BigInt(1) << BigInt(35),
  /**
   * Allows for creating private threads
   *
   * Applies to channel types: Text
   */
  CreatePrivateThreads: BigInt(1) << BigInt(36),
  /**
   * Allows the usage of custom stickers from other servers
   *
   * Applies to channel types: Text, Voice, Stage
   */
  UseExternalStickers: BigInt(1) << BigInt(37),
  /**
   * Allows for sending messages in threads
   *
   * Applies to channel types: Text
   */
  SendMessagesInThreads: BigInt(1) << BigInt(38),
  /**
   * Allows for using Activities (applications with the {@link ApplicationFlags.Embedded} flag) in a voice channel
   *
   * Applies to channel types: Voice
   */
  UseEmbeddedActivities: BigInt(1) << BigInt(39),
  /**
   * Allows for timing out users to prevent them from sending or reacting to messages in chat and threads,
   * and from speaking in voice and stage channels
   */
  ModerateMembers: BigInt(1) << BigInt(40),
  /**
   * Allows for viewing role subscription insights
   */
  ViewCreatorMonetizationAnalytics: BigInt(1) << BigInt(41),
  /**
   * Allows for using soundboard in a voice channel
   *
   * Applies to channel types: Voice
   */
  UseSoundboard: BigInt(1) << BigInt(42),
  /**
   * Allows for creating emojis, stickers, and soundboard sounds, and editing and deleting those created by the current user
   */
  CreateGuildExpressions: BigInt(1) << BigInt(43),
  /**
   * Allows for creating scheduled events, and editing and deleting those created by the current user
   *
   * Applies to channel types: Voice, Stage
   */
  CreateEvents: BigInt(1) << BigInt(44),
  /**
   * Allows the usage of custom soundboard sounds from other servers
   *
   * Applies to channel types: Voice
   */
  UseExternalSounds: BigInt(1) << BigInt(45),
  /**
   * Allows sending voice messages
   *
   * Applies to channel types: Text, Voice, Stage
   */
  SendVoiceMessages: BigInt(1) << BigInt(46),
  /**
   * Allows sending polls
   *
   * Applies to channel types: Text, Voice, Stage
   */
  SendPolls: BigInt(1) << BigInt(49),
  /**
   * Allows user-installed apps to send public responses. When disabled, users will still be allowed to use their apps but the responses will be ephemeral. This only applies to apps not also installed to the server
   *
   * Applies to channel types: Text, Voice, Stage
   */
  UseExternalApps: BigInt(1) << BigInt(50),
  /**
   * Allows pinning and unpinning messages
   *
   * Applies to channel types: Text
   */
  PinMessages: BigInt(1) << BigInt(51),
  /**
   * Allows bypassing slowmode restrictions
   *
   * Applies to channel types: Text, Voice, Stage
   */
  BypassSlowmode: BigInt(1) << BigInt(52),
} as const;

/**
 * A mapping of permission flag names to their aliases, because the API names are not always matching the ones in the Discord UI.
 */
const PermissionAliases: Partial<Record<keyof typeof PermissionFlagsBits, string>> = {
  CreateInstantInvite: "Create Invite",
  ManageGuild: "Manage Server",
  ViewGuildInsights: "View Server Insights",
  UseVAD: "Use Voice Activity",
  PrioritySpeaker: "Use Priority Speaker",
  CreateGuildExpressions: "Create Expressions",
  ManageGuildExpressions: "Manage Expressions",
};

/**
 * Generates an array of permission objects with labels and values.
 *
 * Converts the PermissionFlagsBits object into an array of objects containing:
 * - `label`: The human-readable permission name (from PermissionAliases or key turned to 'Title Case')
 * - `value`: The corresponding bigint permission flag value
 *
 * @returns An array of permission objects sorted by their key names.
 */
export function GetPermissionsArray(stringified: true): { label: string; value: string }[];
export function GetPermissionsArray(stringified?: false): { label: string; value: bigint }[];
export function GetPermissionsArray(stringified?: boolean) {
  return Object.keys(PermissionFlagsBits).reduce(
    (obj, key) => {
      obj.push({
        label: PermissionAliases[key as keyof typeof PermissionFlagsBits] ?? toTitleCase(key),
        value: stringified
          ? PermissionFlagsBits[key as keyof typeof PermissionFlagsBits].toString()
          : PermissionFlagsBits[key as keyof typeof PermissionFlagsBits],
      });
      return obj;
    },
    [] as { label: string; value: string | bigint }[],
  );
}
