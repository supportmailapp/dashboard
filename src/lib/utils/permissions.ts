// Permission utilities for Discord permissions.

import { PermissionsBitField, type PermissionsString } from "discord.js";

type PermissionResolvable = PermissionsString | bigint;

/**
 * Checks if a specific permission exists in a permission set.
 * @param permissions - The permissions to check.
 * @param permission - The permission to check for.
 *
 * ### Note: If the user has admin, `true` will be returned regardless of the other permission.
 */
export function hasPermission(permissions: PermissionResolvable, permission: PermissionsString) {
  return new PermissionsBitField(permissions).has(permission);
}

/**
 * Checks if the given permissions include all the specified permission flags.
 *
 * @param permissions - The set of permissions to check against.
 * @param permissionFlags - The permission flags to check for.
 * @returns `true` if all the specified permission flags are included in the given permissions, otherwise `false`.
 *
 * ### Note: If the user has admin, `true` will be returned regardless of the other permissions.
 */
export function hasPermissions(
  permissions: PermissionResolvable,
  ...permissionFlags: PermissionResolvable[]
): boolean {
  return permissionFlags.every((permissionFlag) => new PermissionsBitField(permissions).has(permissionFlag));
}

/**
 * Checks if the given permissions include the ability to manage the bot.
 *
 * This function verifies if the provided `permissions` contain both
 * "Administrator" and "ManageGuild" permissions.
 *
 * @param permissions - The permission bits to check.
 * @returns `true` if the permissions include both "administrator" and "manageGuild", otherwise `false`.
 */
export function canManageBot(permissions: bigint | string): boolean {
  return hasPermissions(
    typeof permissions === "bigint" ? permissions : BigInt(permissions),
    "Administrator",
    "ManageGuild",
  );
}
