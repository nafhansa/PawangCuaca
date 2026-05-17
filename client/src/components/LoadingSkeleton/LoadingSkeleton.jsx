import './LoadingSkeleton.css';

function LoadingSkeleton() {
  return (
    <div className="loading-skeleton">
      <div className="skeleton-card">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-temp" />
        <div className="skeleton skeleton-desc" />
        <div className="skeleton-meta">
          <div className="skeleton skeleton-meta-item" />
          <div className="skeleton skeleton-meta-item" />
          <div className="skeleton skeleton-meta-item" />
        </div>
      </div>
      <div className="skeleton-hourly">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-hourly-item">
            <div className="skeleton skeleton-hourly-time" />
            <div className="skeleton skeleton-hourly-icon" />
            <div className="skeleton skeleton-hourly-temp" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoadingSkeleton;
