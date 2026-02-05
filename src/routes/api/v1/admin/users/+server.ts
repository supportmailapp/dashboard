import { JsonErrors } from "$lib/constants.js";
import { DBUser, FlattenDocToJSON } from "$lib/server/db";
import { ZodValidator } from "$lib/server/validators/index.js";
import { UserRole } from "$lib/sm-types/src";
import { SnowflakeSchema } from "$v1Api/assertions";
import { json } from "@sveltejs/kit";
import z from "zod";

const dbUserSchema = z.object({
  id: SnowflakeSchema,
  roles: z.array(z.enum(UserRole)).default([UserRole.User]).transform((roles) => !roles.includes(UserRole.User) ? [...roles, UserRole.User] : roles),
});

export async function POST({ request }) {
  const jsonReq = await request.json().catch(() => null);
  if (!jsonReq) {
    return JsonErrors.badRequest("Invalid JSON body");
  }
  const valRes = new ZodValidator(dbUserSchema).validate(jsonReq);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  const user = await DBUser.create({
    id: valRes.data.id,
    roles: valRes.data.roles,
  });

  return json(FlattenDocToJSON(user), { status: 201 });
}

export async function PATCH({ request }) {
  const jsonReq = await request.json().catch(() => null);
  if (!jsonReq) {
    return JsonErrors.badRequest("Invalid JSON body");
  }
  const valRes = new ZodValidator(dbUserSchema).validate(jsonReq);
  if (!valRes.success) {
    return JsonErrors.badRequest(valRes.error.message);
  }

  const user = await DBUser.findOneAndUpdate(
    {
      id: valRes.data.id
    },
    {
      id: valRes.data.id,
      roles: valRes.data.roles,
    },
    { new: true, upsert: true },
  );

  return json(FlattenDocToJSON(user), { status: 200 });
}
