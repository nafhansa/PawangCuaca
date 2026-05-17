const NodeCache = require('node-cache');
const logger = require('../utils/logger');

const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL_SECONDS, 10) || 600,
  checkperiod: 120,
  useClones: false,
});

function get(key) {
  const value = cache.get(key);
  if (value !== undefined) {
    logger.debug(`Cache hit for key: ${key}`);
    return value;
  }
  logger.debug(`Cache miss for key: ${key}`);
  return null;
}

function set(key, value, ttl) {
  const success = cache.set(key, value, ttl || parseInt(process.env.CACHE_TTL_SECONDS, 10) || 600);
  if (success) {
    logger.debug(`Cache set for key: ${key}`);
  }
  return success;
}

function del(key) {
  return cache.del(key);
}

function flush() {
  cache.flushAll();
  logger.info('Cache flushed');
}

module.exports = { get, set, del, flush };
