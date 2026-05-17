import { motion } from 'framer-motion';
import AccuracyBadge from '../AccuracyBadge/AccuracyBadge';
import { formatTemperature, formatWindSpeed, formatVisibility, getWeatherCondition } from '../../utils/formatWeather';
import './WeatherCard.css';

const weatherCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

function WeatherCard({ weather, accuracy }) {
  if (!weather) return null;

  const { current } = weather;

  return (
    <motion.div
      className="weather-card"
      variants={weatherCardVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="weather-icon-container">
        <span className="weather-emoji" role="img" aria-label={current.weather_description}>
          {current.weather_emoji}
        </span>
      </div>

      <div className="weather-temp">
        {formatTemperature(current.temp_c)}
      </div>

      <div className="weather-description">
        {current.weather_description}
      </div>

      <div className="weather-condition">
        {getWeatherCondition(current.weather_code)}
      </div>

      <div className="weather-meta">
        <div className="meta-item">
          <span className="meta-label">Terasa</span>
          <span className="meta-value">{formatTemperature(current.feels_like_c)}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Kelembapan</span>
          <span className="meta-value">{current.humidity}%</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Angin</span>
          <span className="meta-value">{formatWindSpeed(current.wind_speed_kmh)}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">UV Index</span>
          <span className="meta-value">{current.uvi}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Visibilitas</span>
          <span className="meta-value">{formatVisibility(current.visibility_m)}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Awan</span>
          <span className="meta-value">{current.cloud_pct}%</span>
        </div>
      </div>

      {accuracy !== undefined && (
        <div className="weather-accuracy">
          <AccuracyBadge accuracy={accuracy} />
        </div>
      )}
    </motion.div>
  );
}

export default WeatherCard;
