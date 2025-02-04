import dayjs from "dayjs";
import type { LayoutServerLoad } from "./$types";

export const load = (async ({ locals }) => {
  const data = {
    date: dayjs().toDate(),
    iso: dayjs().toISOString(),
  };

  if (!locals.user) return data;

  return {
    ...data,
    user: locals.user,
  };
}) satisfies LayoutServerLoad;
