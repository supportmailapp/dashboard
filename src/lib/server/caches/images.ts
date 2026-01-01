import NodeCache from "node-cache";

const images = new NodeCache({
  stdTTL: 300,
  errorOnMissing: false,
  useClones: false,
});

export { images };
