interface CardProps {
  title: string;
  poster: string | null;
  badge?: string | null;
  sub?: string | null;
  progress?: number | null; // 0..1
  onClick?: () => void;
}

export function Card({ title, poster, badge, sub, progress, onClick }: CardProps) {
  return (
    <button className="card" onClick={onClick} title={title}>
      <div className="card-poster">
        {poster ? (
          <img src={poster} alt={title} loading="lazy" />
        ) : (
          <div className="card-noposter">{title.slice(0, 1)}</div>
        )}
        {badge && <span className="card-badge">{badge}</span>}
        {progress != null && progress > 0 && (
          <span className="card-progress">
            <span style={{ width: `${Math.min(100, progress * 100)}%` }} />
          </span>
        )}
      </div>
      <div className="card-title">{title}</div>
      {sub && <div className="card-sub">{sub}</div>}
    </button>
  );
}
