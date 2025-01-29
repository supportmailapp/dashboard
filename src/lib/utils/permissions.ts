// Permission utilities for Discord permissions.

type PermissionResolvable = bigint | number | PermissionFlags;

type PermissionFlags = keyof typeof PERMISSIONS;

type PermissionBits = bigint | number;

export const PERMISSIONS = {
  administrator: BigInt(0x8),
  manageGuild: BigInt(0x20),
  manageChannels: BigInt(0x10000010),
  manageRoles: BigInt(0x10000000),
  viewChannel: BigInt(0x400),
} as const;

/**
 * Checks if the given permissions include a specific permission flag.
 *
 * @see [Bitwise Permission Flags](https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags) For more information on permission flags.
 *
 * @param permissions - The bitfield representing the set of permissions.
 * @param permissionFlag - The specific permission flag to check for.
 * @returns `true` if the permissions include the specified permission flag, otherwise `false`.
 */
export function hasPermission(permissions: PermissionBits, permissionFlag: PermissionResolvable): boolean {
  // Ensure both values are BigInt
  const bigIntBitfield = BigInt(permissions);
  const bigIntPermission = BigInt(typeof permissionFlag == "string" ? PERMISSIONS[permissionFlag] : permissionFlag);

  // Perform bitwise AND operation
  return (bigIntBitfield & bigIntPermission) === bigIntPermission;
}

/**
 * Checks if the given permissions include all the specified permission flags.
 *
 * @param permissions - The set of permissions to check against.
 * @param permissionFlags - The permission flags to check for.
 * @returns `true` if all the specified permission flags are included in the given permissions, otherwise `false`.
 */
export function hasPermissions(permissions: PermissionBits, ...permissionFlags: PermissionResolvable[]): boolean {
  return permissionFlags.every((permissionFlag) => hasPermission(permissions, permissionFlag));
}

/**
 * Checks if the given permissions include the ability to manage the bot.
 *
 * This function verifies if the provided `permissions` contain both
 * "administrator" and "manageGuild" permissions.
 *
 * @param permissions - The permission bits to check.
 * @returns `true` if the permissions include both "administrator" and "manageGuild", otherwise `false`.
 */
export function canManageBot(permissions: PermissionBits): boolean {
  return hasPermissions(permissions, "administrator", "manageGuild");
}
