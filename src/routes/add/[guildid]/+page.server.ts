export async function load({ params }) {
  return {
    easterEgg: params.guildid === "undefined",
  };
}
