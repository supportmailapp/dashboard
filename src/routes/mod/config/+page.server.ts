import { validateSearchParams } from "runed/kit";
import { searchParamsSchema, type ConfigKey } from "./+page.svelte";

export async function load({ url }) {
  const { data } = validateSearchParams(url, searchParamsSchema);
  if (!/^\d+$/.test(data.guild)) {
    return {
      status: 400,
      error: new Error("Invalid guild ID. It must be a numeric string."),
    };
  }

  let guildId = data.guild;
  let configData: Partial<Record<ConfigKey, any>> = {};

  return {
    status: 200,
    configs: configData,
  };
}
