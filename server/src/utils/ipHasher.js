const crypto = require('crypto');

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

function generateVoterHash(ip, fingerprint, dateStr) {
  const dateString = dateStr || new Date().toISOString().split('T')[0];
  return crypto
    .createHash('sha256')
    .update(`${ip}:${fingerprint}:${dateString}`)
    .digest('hex');
}

module.exports = { hashIP, generateVoterHash };
