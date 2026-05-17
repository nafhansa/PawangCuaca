import { motion } from 'framer-motion';
import { formatTemperature } from '../../utils/formatWeather';
import './HourlyForecast.css';

const hourlyItemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

function HourlyForecast({ hourly }) {
  if (!hourly || hourly.length === 0) return null;

  return (
    <div className="hourly-forecast">
      <h3 className="hourly-title">Prakiraan Per Jam</h3>
      <div className="hourly-scroll">
        {hourly.map((hour, index) => (
          <motion.div
            key={hour.dt}
            className="hourly-item"
            variants={hourlyItemVariants}
            initial="hidden"
            animate="visible"
            custom={index}
          >
            <span className="hourly-time">{hour.hour_label}</span>
            <span className="hourly-emoji" role="img" aria-label={hour.weather_description}>
              {hour.weather_emoji}
            </span>
            <span className="hourly-temp">{formatTemperature(hour.temp_c)}</span>
            {hour.pop > 0.3 && (
              <span className="hourly-pop">{Math.round(hour.pop * 100)}%</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default HourlyForecast;
