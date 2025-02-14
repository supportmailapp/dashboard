import mongoose from "mongoose";

export const load = async ({ params: { slug: guildId } }) => {
  const res = await mongoose.connection.db?.collection("guilds").findOne({ id: guildId }, { serializeFunctions: true });
  let guildConfig = null;
  if (res) guildConfig = res;
  return {
    guildConfig: guildConfig,
  };
};
