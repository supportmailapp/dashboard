import { JsonErrors } from "$lib/constants";
import { BlacklistEntry, FlattenDocToJSON } from "$lib/server/db/index.js";
import { safeParseInt } from "$lib/utils";
import type { FilterQuery } from "mongoose";
import { BlacklistScope, EntityType, type IBlacklistEntry } from "supportmail-types";

export type BlacklistResponse = PaginatedResponse<DocumentWithId<IBlacklistEntry>>;

type PossibleFilterTypes = Exclude<EntityType, EntityType.guild> | -1;

export async function GET({ locals, url }) {
  if (!locals.guildId || !locals.isAuthenticated()) return JsonErrors.unauthorized();
  const guildId = locals.guildId;

  try {
    // Parse pagination parameters
    const Params = {
      page: safeParseInt(url.searchParams.get("page"), 1, 1),
      pageSize: safeParseInt(url.searchParams.get("pageSize"), 20, 10, 100),
      searchUserId: url.searchParams.has("search")
        ? decodeURIComponent(url.searchParams.get("search")!)
        : undefined,
      searchScope: safeParseInt(
        url.searchParams.get("scope"),
        BlacklistScope.all,
        BlacklistScope.all,
        BlacklistScope.tags,
      ) as BlacklistScope,
      filterType: safeParseInt(url.searchParams.get("etype"), -1, 1, 2) as PossibleFilterTypes,
    };

    const skip = (Params.page - 1) * Params.pageSize;

    // Build filter query
    const filter: FilterQuery<IBlacklistEntry> = { guildId: guildId };

    if (Params.searchUserId) {
      filter.id = { $regex: Params.searchUserId, $options: "i" };
    }

    // Query blacklist entries for the guild with pagination
    const [blacklistEntries, totalItems] = await Promise.all([
      BlacklistEntry.find(filter, null, {
        sort: { createdAt: -1 },
        skip: skip,
        limit: Params.pageSize,
      }),
      BlacklistEntry.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / Params.pageSize);

    const response: BlacklistResponse = {
      data: blacklistEntries.map((d) => FlattenDocToJSON(d, true)),
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
    const response: BlacklistResponse = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
      },
      error: "Failed to fetch blacklist entries",
    };

    return Response.json(response, { status: 500 });
  }
}
