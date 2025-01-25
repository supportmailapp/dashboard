import dayjs from "dayjs";
import type { LayoutServerLoad } from "./$types";

export const load = (async () => {
  return {
    date: dayjs().toDate(),
    iso: dayjs().toISOString(),
  };
}) satisfies LayoutServerLoad;
