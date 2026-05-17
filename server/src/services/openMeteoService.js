const axios = require('axios');
const { ExternalServiceError } = require('../utils/errors');
const logger = require('../utils/logger');

const BASE_URL = 'https://api.open-meteo.com/v1';

const CURRENT_VARS = 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day';
const HOURLY_VARS = 'temperature_2m,apparent_temperature,precipitation_probability,weather_code,cloud_cover,wind_speed_10m,visibility';
const DAILY_VARS = 'uv_index_max';

async function fetchWeather(lat, lon) {
  try {
    const url = `${BASE_URL}/forecast`;
    const response = await axios.get(url, {
      params: {
        latitude: lat,
        longitude: lon,
        current: CURRENT_VARS,
        hourly: HOURLY_VARS,
        daily: DAILY_VARS,
        timezone: 'auto',
        forecast_days: 2,
      },
      timeout: 10000,
    });

    return response.data;
  } catch (err) {
    if (err.response) {
      logger.error('Open-Meteo API error', {
        status: err.response.status,
        data: err.response.data,
      });
      throw new ExternalServiceError('Layanan cuaca eksternal sedang tidak tersedia. Coba lagi nanti.');
    }
    if (err.code === 'ECONNABORTED') {
      throw new ExternalServiceError('Request ke layanan cuaca timeout. Coba lagi nanti.');
    }
    logger.error('Open-Meteo fetch error', { error: err.message });
    throw new ExternalServiceError('Layanan cuaca eksternal sedang tidak tersedia. Coba lagi nanti.');
  }
}

function wmoEmoji(code) {
  const map = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌧️',
    56: '🌧️', 57: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    66: '🌨️', 67: '🌨️',
    71: '🌨️', 73: '❄️', 75: '❄️',
    77: '🌨️',
    80: '🌦️', 81: '🌧️', 82: '⛈️',
    85: '🌨️', 86: '🌨️',
    95: '⛈️', 96: '⛈️', 99: '⛈️',
  };
  return map[code] || '🌡️';
}

function wmoDescription(code) {
  const map = {
    0: 'Cerah', 1: 'Cerah berawan', 2: 'Berawan sebagian', 3: 'Mendung',
    45: 'Kabut', 48: 'Kabut beku',
    51: 'Gerimis ringan', 53: 'Gerimis', 55: 'Gerimis lebat',
    56: 'Gerimis beku ringan', 57: 'Gerimis beku lebat',
    61: 'Hujan ringan', 63: 'Hujan', 65: 'Hujan lebat',
    66: 'Hujan beku ringan', 67: 'Hujan beku lebat',
    71: 'Salju ringan', 73: 'Salju', 75: 'Salju lebat',
    77: 'Butiran salju',
    80: 'Hujan ringan', 81: 'Hujan deras', 82: 'Hujan sangat lebat',
    85: 'Hujan salju ringan', 86: 'Hujan salju lebat',
    95: 'Badai petir', 96: 'Badai petir dengan hail', 99: 'Badai petir hebat',
  };
  return map[code] || 'Tidak diketahui';
}

function getWeatherMain(code) {
  if (code <= 1) return 'Clear';
  if (code <= 3) return 'Clouds';
  if (code < 50) return 'Fog';
  if (code < 60) return 'Drizzle';
  if (code < 70) return 'Rain';
  if (code < 80) return 'Snow';
  if (code < 90) return 'Rain';
  return 'Thunderstorm';
}

function parseCurrentWeather(data) {
  const c = data.current;
  const d = data.daily;

  return {
    dt: Math.floor(new Date(c.time).getTime() / 1000),
    temp_c: Math.round(c.temperature_2m * 10) / 10,
    feels_like_c: Math.round(c.apparent_temperature * 10) / 10,
    humidity: c.relative_humidity_2m,
    wind_speed_kmh: Math.round((c.wind_speed_10m || 0) * 10) / 10,
    weather_code: c.weather_code,
    weather_main: getWeatherMain(c.weather_code),
    weather_description: wmoDescription(c.weather_code),
    weather_emoji: wmoEmoji(c.weather_code),
    uvi: d?.uv_index_max?.[0] != null ? Math.round(d.uv_index_max[0] * 10) / 10 : 0,
    visibility_m: c.visibility || 0,
    cloud_pct: c.cloud_cover,
  };
}

function parseHourlyForecast(data, hours = 12) {
  const h = data.hourly;
  if (!h || !h.time) return [];

  const now = new Date();
  const results = [];

  for (let i = 0; i < h.time.length && results.length < hours; i++) {
    const time = new Date(h.time[i]);
    if (time <= now) continue;

    const hourLabel = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
    const isDay = h.is_day ? h.is_day[i] : 1;

    results.push({
      dt: Math.floor(time.getTime() / 1000),
      hour_label: hourLabel,
      temp_c: Math.round(h.temperature_2m[i] * 10) / 10,
      pop: Math.round((h.precipitation_probability[i] || 0) * 100) / 100,
      weather_emoji: wmoEmoji(h.weather_code[i]),
      weather_description: wmoDescription(h.weather_code[i]),
      weather_code: h.weather_code[i],
      is_day: isDay,
      forecast_hour: time.toISOString(),
    });
  }

  return results;
}

module.exports = {
  fetchWeather,
  parseCurrentWeather,
  parseHourlyForecast,
};
