const cacheService = require('../services/cacheService');
const openWeatherService = require('../services/openWeatherService');
const logger = require('../utils/logger');

async function getWeather(req, res, next) {
  try {
    const { lat, lon } = req.query;
    const cacheKey = `weather:${lat}:${lon}`;

    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: {
          ...cached,
          cached: true,
        },
      });
    }

    const owmData = await openWeatherService.fetchWeather(lat, lon);
    const current = openWeatherService.parseCurrentWeather(owmData, lat, lon);
    const hourly = openWeatherService.parseHourlyForecast(owmData, 12);

    const responseData = {
      location: {
        geohash: null,
        label: null,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      },
      current,
      hourly,
      cached: false,
      fetched_at: new Date().toISOString(),
    };

    cacheService.set(cacheKey, responseData);

    return res.json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    return next(err);
  }
}

async function getWeatherVotes(req, res, next) {
  try {
    const { lat, lon, hours } = req.query;
    const voterHash = req.headers['x-voter-hash'] || null;

    const voteService = require('../services/voteService');
    const geoHash = require('../utils/geoHash');

    const gh = geoHash.encode(parseFloat(lat), parseFloat(lon), 5);
    const location = await voteService.getOrCreateLocation(lat, lon);
    const votesByHour = await voteService.getVotesByHour(location.id, hours, voterHash);

    return res.json({
      success: true,
      data: {
        geohash: gh,
        votes_by_hour: votesByHour,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getWeather, getWeatherVotes };
