import { getAccuracyColor } from '../../utils/formatWeather';

function AccuracyBadge({ accuracy }) {
  if (accuracy === null || accuracy === undefined) {
    return (
      <div className="accuracy-badge" style={{ backgroundColor: '#484F58' }}>
        Belum ada data
      </div>
    );
  }

  const color = getAccuracyColor(accuracy);

  return (
    <div className="accuracy-badge" style={{ backgroundColor: color }}>
      Akurasi {accuracy.toFixed(1)}%
    </div>
  );
}

export default AccuracyBadge;
