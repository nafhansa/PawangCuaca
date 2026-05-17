const axios = require('axios');
const { ExternalServiceError } = require('../utils/errors');
const logger = require('../utils/logger');

const BASE_URL = process.env.OPENWEATHERMAP_BASE_URL || 'https://api.openweathermap.org/data/3.0';
const API_KEY = process.env.OPENWEATHERMAP_API_KEY;

async function fetchWeather(lat, lon) {
  if (!API_KEY) {
    throw new ExternalServiceError('OpenWeatherMap API key not configured');
  }

  try {
    const url = `${BASE_URL}/onecall`;
    const response = await axios.get(url, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        units: 'metric',
        lang: 'id',
        exclude: 'minutely,daily,alerts',
      },
      timeout: 10000,
    });

    return response.data;
  } catch (err) {
    if (err.response) {
      logger.error('OpenWeatherMap API error', {
        status: err.response.status,
        data: err.response.data,
      });
      throw new ExternalServiceError('Layanan cuaca eksternal sedang tidak tersedia. Coba lagi nanti.');
    }
    if (err.code === 'ECONNABORTED') {
      throw new ExternalServiceError('Request ke layanan cuaca timeout. Coba lagi nanti.');
    }
    logger.error('OpenWeatherMap fetch error', { error: err.message });
    throw new ExternalServiceError('Layanan cuaca eksternal sedang tidak tersedia. Coba lagi nanti.');
  }
}

function parseCurrentWeather(data, lat, lon) {
  const current = data.current;
  const weather = current.weather?.[0] || {};

  return {
    dt: current.dt,
    temp_c: Math.round(current.temp * 10) / 10,
    feels_like_c: Math.round(current.feels_like * 10) / 10,
    humidity: current.humidity,
    wind_speed_kmh: Math.round(current.wind_speed * 3.6 * 10) / 10,
    weather_code: weather.id || 0,
    weather_main: weather.main || 'Unknown',
    weather_description: weather.description || '',
    weather_icon: weather.icon || '',
    icon_url: weather.icon
      ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
      : '',
    uvi: Math.round(current.uvi * 10) / 10,
    visibility_m: current.visibility || 0,
    cloud_pct: current.clouds || 0,
  };
}

function parseHourlyForecast(data, hours = 12) {
  const hourly = data.hourly || [];
  const now = Math.floor(Date.now() / 1000);

  return hourly
    .filter((h) => h.dt >= now)
    .slice(0, hours)
    .map((h) => {
      const weather = h.weather?.[0] || {};
      const date = new Date(h.dt * 1000);
      const hourLabel = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      return {
        dt: h.dt,
        hour_label: hourLabel,
        temp_c: Math.round(h.temp * 10) / 10,
        pop: Math.round((h.pop || 0) * 100) / 100,
        weather_icon: weather.icon || '',
        weather_description: weather.description || '',
      };
    });
}

module.exports = {
  fetchWeather,
  parseCurrentWeather,
  parseHourlyForecast,
};
