interface ContinueCardProps {
  title: string;
  poster: string | null;
  sub?: string | null;
  progress?: number | null; // 0..1
  fresh?: string | null; // e.g. "Ep 4 da vedere": highlights the card
  onClick?: () => void;
  onRemove?: () => void;
}

// compact horizontal card for "Continua a guardare" — small poster + title
export function ContinueCard({
  title,
  poster,
  sub,
  progress,
  fresh,
  onClick,
  onRemove,
}: ContinueCardProps) {
  return (
    <button className={"ccard" + (fresh ? " ccard--new" : "")} onClick={onClick} title={title}>
      <div className="ccard-poster">
        {poster ? (
          <img src={poster} alt={title} loading="lazy" />
        ) : (
          <div className="card-noposter">{title.slice(0, 1)}</div>
        )}
        {progress != null && progress > 0 && (
          <span className="ccard-progress">
            <span style={{ width: `${Math.min(100, progress * 100)}%` }} />
          </span>
        )}
      </div>
      <div className="ccard-body">
        <div className="ccard-title">{title}</div>
        {sub && <div className="ccard-sub">{sub}</div>}
        {fresh && <div className="ccard-new">● {fresh}</div>}
      </div>
      {onRemove && (
        <span
          className="ccard-remove"
          role="button"
          aria-label="Rimuovi"
          title="Rimuovi"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </span>
      )}
    </button>
  );
}
