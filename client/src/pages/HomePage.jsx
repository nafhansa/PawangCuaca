import { useState } from 'react';
import useGeolocation from '../hooks/useGeolocation';
import useWeather from '../hooks/useWeather';
import useVoting from '../hooks/useVoting';
import useFingerprint from '../hooks/useFingerprint';
import LoadingSkeleton from '../components/LoadingSkeleton/LoadingSkeleton';
import WeatherCard from '../components/WeatherCard/WeatherCard';
import HourlyForecast from '../components/HourlyForecast/HourlyForecast';
import VotingPanel from '../components/VotingPanel/VotingPanel';
import LocationMap from '../components/LocationMap/LocationMap';

function HomePage() {
  const { coords, error: geoError, loading: geoLoading, retry: retryGeo } = useGeolocation();
  const { fingerprint } = useFingerprint();
  const [manualCoords, setManualCoords] = useState(null);
  const [manualInput, setManualInput] = useState({ lat: '', lon: '' });

  const activeCoords = manualCoords || coords;
  const lat = activeCoords?.lat;
  const lon = activeCoords?.lon;

  const { weather, hourly, loading: weatherLoading, error: weatherError, refetch } = useWeather(lat, lon);

  const currentHour = hourly?.[0];
  const {
    votes,
    userVote,
    submitVote,
    loading: voteLoading,
    error: voteError,
  } = useVoting(lat, lon, currentHour?.forecast_hour);

  const handleVote = async (voteType) => {
    if (!fingerprint) return;
    await submitVote(voteType, fingerprint);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const latVal = parseFloat(manualInput.lat);
    const lonVal = parseFloat(manualInput.lon);
    if (!isNaN(latVal) && !isNaN(lonVal)) {
      setManualCoords({ lat: latVal, lon: lonVal });
    }
  };

  const accuracy = votes?.accuracy_pct;

  return (
    <div className="home-page">
      <div className="location-bar">
        <div>
          <div className="location-label">
            {activeCoords
              ? `Lat: ${activeCoords.lat.toFixed(4)}, Lon: ${activeCoords.lon.toFixed(4)}`
              : 'Mendeteksi lokasi...'}
          </div>
        </div>
        <button className="refresh-btn" onClick={retryGeo}>
          Refresh Lokasi
        </button>
      </div>

      {geoError && !activeCoords && (
        <div className="manual-location">
          <h3>Lokasi tidak terdeteksi</h3>
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', fontSize: '0.875rem' }}>
            Masukkan koordinat secara manual
          </p>
          <form className="manual-location-form" onSubmit={handleManualSubmit}>
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={manualInput.lat}
              onChange={(e) => setManualInput({ ...manualInput, lat: e.target.value })}
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={manualInput.lon}
              onChange={(e) => setManualInput({ ...manualInput, lon: e.target.value })}
            />
            <button type="submit">Cari</button>
          </form>
        </div>
      )}

      {weatherLoading && !weather && <LoadingSkeleton />}

      {weatherError && (
        <div className="error-message">
          {weatherError}
        </div>
      )}

      {weather && (
        <>
          <WeatherCard weather={weather} accuracy={accuracy} />
          <HourlyForecast hourly={hourly} />
          {currentHour && (
            <VotingPanel
              votes={votes}
              userVote={userVote}
              onVote={handleVote}
              loading={voteLoading}
            />
          )}
          {lat && lon && (
            <LocationMap lat={lat} lon={lon} label="Lokasi kamu" />
          )}
        </>
      )}

      {voteError && (
        <div className="error-message">
          {voteError}
        </div>
      )}
    </div>
  );
}

export default HomePage;
