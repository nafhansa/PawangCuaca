const { pool } = require('../db/pool');
const axios = require('axios');
const logger = require('../utils/logger');

async function reverseGeocode(lat, lon) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat,
        lon,
        format: 'json',
        zoom: 12,
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'PawangCuaca/1.0',
      },
      timeout: 5000,
    });

    const addr = response.data.address;
    if (!addr) return null;

    return [
      addr.suburb || addr.neighbourhood || addr.quarter,
      addr.city || addr.town || addr.village || addr.municipality,
      addr.state,
    ].filter(Boolean).join(', ') || null;
  } catch (err) {
    logger.error('Reverse geocode error', { error: err.message });
    return null;
  }
}

async function backfillLabels() {
  const locations = await pool.query(
    'SELECT id, lat, lon FROM locations WHERE label IS NULL'
  );

  if (locations.rows.length === 0) {
    console.log('No locations need label update.');
    return;
  }

  console.log(`Updating ${locations.rows.length} locations...`);

  for (const loc of locations.rows) {
    const label = await reverseGeocode(loc.lat, loc.lon);
    if (label) {
      await pool.query('UPDATE locations SET label = $1 WHERE id = $2', [label, loc.id]);
      console.log(`  ID ${loc.id}: ${label}`);
    } else {
      console.log(`  ID ${loc.id}: failed to geocode`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  console.log('Done!');
  process.exit(0);
}

backfillLabels();
