type PermissionResolvable = bigint | number | string;

/**
 * Checks if the given permissions include a specific permission flag.
 *
 * @see [Bitwise Permission Flags](https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags) For more information on permission flags.
 *
 * @param permissions - The bitfield representing the set of permissions.
 * @param permissionFlag - The specific permission flag to check for.
 * @returns `true` if the permissions include the specified permission flag, otherwise `false`.
 */
export function hasPermission(permissions: PermissionResolvable, permissionFlag: PermissionResolvable): boolean {
  // Ensure both values are BigInt
  const bigIntBitfield = BigInt(permissions);
  const bigIntPermission = BigInt(permissionFlag);

  // Perform bitwise AND operation
  return (bigIntBitfield & bigIntPermission) === bigIntPermission;
}
