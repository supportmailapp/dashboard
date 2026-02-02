import NodeCache from "node-cache";

export default new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  errorOnMissing: false,
});
