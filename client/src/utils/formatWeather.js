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
  if (code === 0) return 'Cerah';
  if (code === 1) return 'Cerah berawan';
  if (code === 2) return 'Berawan sebagian';
  if (code === 3) return 'Mendung';
  if (code === 45 || code === 48) return 'Kabut';
  if (code >= 51 && code <= 57) return 'Gerimis';
  if (code >= 61 && code <= 67) return 'Hujan';
  if (code >= 71 && code <= 77) return 'Salju';
  if (code >= 80 && code <= 82) return 'Hujan deras';
  if (code >= 85 && code <= 86) return 'Hujan salju';
  if (code >= 95) return 'Badai petir';
  return 'Tidak diketahui';
}

export function getAccuracyColor(pct) {
  if (pct === null || pct === undefined) return '#6B7280';
  if (pct >= 80) return '#22C55E';
  if (pct >= 60) return '#F59E0B';
  return '#EF4444';
}
