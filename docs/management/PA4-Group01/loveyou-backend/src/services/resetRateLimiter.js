const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 3;

/** @type {Map<string, number[]>} */
const requestsByEmail = new Map();

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function prune(timestamps, now = Date.now()) {
  return timestamps.filter((ts) => now - ts < WINDOW_MS);
}

function canRequest(email) {
  const key = normalizeEmail(email);
  const now = Date.now();
  const timestamps = prune(requestsByEmail.get(key) || [], now);
  requestsByEmail.set(key, timestamps);
  return timestamps.length < MAX_REQUESTS;
}

function recordRequest(email) {
  const key = normalizeEmail(email);
  const now = Date.now();
  const timestamps = prune(requestsByEmail.get(key) || [], now);
  timestamps.push(now);
  requestsByEmail.set(key, timestamps);
}

function clearAll() {
  requestsByEmail.clear();
}

module.exports = {
  canRequest,
  recordRequest,
  clearAll,
  normalizeEmail,
  WINDOW_MS,
  MAX_REQUESTS,
};
