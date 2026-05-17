export function formatTemperature(temp) {
  return `${Math.round(temp)}°C`;
}

export function formatWindSpeed(speed) {
  return `${speed} km/h`;
}

export function formatVisibility(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

export function formatPop(pop) {
  return `${Math.round(pop * 100)}%`;
}

export function getWeatherCondition(code) {
  if (code >= 200 && code < 300) return 'Badai';
  if (code >= 300 && code < 400) return 'Gerimis';
  if (code >= 500 && code < 600) return 'Hujan';
  if (code >= 600 && code < 700) return 'Salju';
  if (code >= 700 && code < 800) return 'Kabut';
  if (code === 800) return 'Cerah';
  if (code > 800) return 'Berawan';
  return 'Tidak diketahui';
}

export function getAccuracyColor(pct) {
  if (pct === null || pct === undefined) return '#6B7280';
  if (pct >= 80) return '#22C55E';
  if (pct >= 60) return '#F59E0B';
  return '#EF4444';
}
