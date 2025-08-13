import { JsonErrors } from "$lib/constants";
import { BlacklistEntry, FlattenDocToJSON } from "$lib/server/db";
import { safeParseInt } from "$lib/utils.js";
import type { FilterQuery } from "mongoose";
import { BlacklistScope, EntityType, type IBlacklistEntry } from "supportmail-types";

export type PaginatedBlacklistResponse = PaginatedResponse<DocumentWithId<IBlacklistEntry>>;

type AllowedEntityType = Exclude<EntityType, EntityType.guild> | -1;

export async function GET({ locals, url }) {
  if (!locals.guildId || !locals.isAuthenticated()) return JsonErrors.unauthorized();
  const guildId = locals.guildId;

  try {
    // Parse pagination parameters
    const Params = {
      page: safeParseInt(url.searchParams.get("page"), 1, 1),
      pageSize: safeParseInt(url.searchParams.get("pageSize"), 20, 10, 100),
      search: url.searchParams.has("search")
        ? decodeURIComponent(url.searchParams.get("search")!)
        : undefined,
      scope: safeParseInt(url.searchParams.get("scope"), BlacklistScope.all, 1, 4) as Exclude<
        BlacklistScope,
        BlacklistScope.global
      >,
      type: safeParseInt(url.searchParams.get("type"), -1) as AllowedEntityType,
    };

    console.log("Params:", Params);

    const skip = (Params.page - 1) * Params.pageSize;

    // Build filter query
    const filter: FilterQuery<IBlacklistEntry> = { guildId: guildId };

    if (Params.search) {
      filter.id = { $regex: Params.search, $options: "i" };
      if (Params.type !== -1) {
        filter._type = Params.type;
      }
    }

    if (Params.scope !== BlacklistScope.all) {
      filter.scope = Params.scope;
    }

    // Query tickets for the guild with pagination
    const [entries, totalItems] = await Promise.all([
      BlacklistEntry.find(filter, null, {
        sort: { lastActive: -1 },
        skip: skip,
        limit: Params.pageSize,
      }),
      BlacklistEntry.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / Params.pageSize);

    const response: PaginatedBlacklistResponse = {
      data: entries.map((d) => FlattenDocToJSON(d, true)),
      pagination: {
        page: Params.page,
        pageSize: Params.pageSize,
        totalItems,
        totalPages,
      },
    };

    console.log("Response:", response);

    return Response.json(response);
  } catch (error) {
    const response: PaginatedBlacklistResponse = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
      },
      error: "Failed to fetch tickets",
    };

    return Response.json(response, { status: 500 });
  }
}
