import NodeCache from "node-cache";

const gAccess = new NodeCache({
  stdTTL: 600,
  errorOnMissing: false,
});

function setAccess(key: string, data: { value: number }) {
  return gAccess.set<{ value: number }>(key, data);
}

function getAccess(key: string) {
  return gAccess.get<{ value: number }>(key);
}

function takeAccess(key: string) {
  return gAccess.take<{ value: number }>(key);
}

function delAccess(key: string) {
  return gAccess.del(key);
}

export default {
  get: getAccess,
  set: setAccess,
  take: takeAccess,
  del: delAccess,
};
