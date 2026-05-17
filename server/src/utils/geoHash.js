const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const MAX_LAT = 90.0;
const MIN_LAT = -90.0;
const MAX_LON = 180.0;
const MIN_LON = -180.0;

function encode(lat, lon, precision = 5) {
  let isEven = true;
  let latMin = MIN_LAT;
  let latMax = MAX_LAT;
  let lonMin = MIN_LON;
  let lonMax = MAX_LON;
  let bit = 0;
  let ch = 0;
  let geohash = '';

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lonMin + lonMax) / 2;
      if (lon > mid) {
        ch |= (1 << (4 - bit));
        lonMin = mid;
      } else {
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat > mid) {
        ch |= (1 << (4 - bit));
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;

    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

function decode(geohash) {
  let isEven = true;
  let latMin = MIN_LAT;
  let latMax = MAX_LAT;
  let lonMin = MIN_LON;
  let lonMax = MAX_LON;

  for (let i = 0; i < geohash.length; i++) {
    const cd = BASE32.indexOf(geohash[i]);
    for (let j = 0; j < 5; j++) {
      const mask = 1 << (4 - j);
      if (isEven) {
        const mid = (lonMin + lonMax) / 2;
        if (cd & mask) {
          lonMin = mid;
        } else {
          lonMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (cd & mask) {
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      isEven = !isEven;
    }
  }

  return {
    lat: (latMin + latMax) / 2,
    lon: (lonMin + lonMax) / 2,
  };
}

module.exports = { encode, decode };
