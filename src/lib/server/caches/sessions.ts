import NodeCache from "node-cache";

const sessionC = new NodeCache({
  stdTTL: 300,
  errorOnMissing: false,
  useClones: false,
});

function setSession(key: string, data: SafeSessionResult) {
  return sessionC.set<SafeSessionResult>(key, data);
}

function getSession(key: string) {
  return sessionC.get<SafeSessionResult>(key);
}

function takeSession(key: string) {
  return sessionC.take<SafeSessionResult>(key);
}

function delSession(key: string) {
  return sessionC.del(key);
}

export default {
  get: getSession,
  set: setSession,
  take: takeSession,
  del: delSession,
};
