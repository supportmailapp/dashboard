import { DBUser, FlattenDocToJSON } from "$lib/server/db";
import { UserRole } from "$lib/sm-types/src";

export async function load() {
  const usersWithHigherPermissions = await DBUser.find({ roles: { $in: [UserRole.Admin, UserRole.Moderator] } });

  return {
    users: usersWithHigherPermissions.map((u) => FlattenDocToJSON(u))
  }
}
