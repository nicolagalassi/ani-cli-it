import { useState, type ReactNode } from "react";
import { X } from "lucide-react";

export type Tone = "sub" | "dub" | "new" | "neutral";

export interface Badge {
  label: string;
  tone?: Tone;
}

// poster image with a lettered fallback when missing or broken
export function Poster({ src, title, eager }: { src: string | null; title: string; eager?: boolean }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken)
    return (
      <span className="poster-fallback" aria-hidden="true">
        {title.trim().slice(0, 1).toUpperCase() || "?"}
      </span>
    );
  return (
    <img
      src={src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}

export function Tag({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}

// exact-length progress: the bar is the value, never decoration
export function Meter({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <span
      className="meter"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
    >
      <span style={{ width: `${v * 100}%` }} />
    </span>
  );
}

interface CardProps {
  title: string;
  poster: string | null;
  badge?: Badge | null;
  sub?: ReactNode;
  progress?: number | null; // 0..1
  onClick?: () => void;
  onRemove?: () => void; // shows a remove button beside the card's main action
  removeLabel?: string;
  busy?: boolean;
  describedBy?: string; // id of extra info shown on hover/focus
  children?: ReactNode; // extra controls under the card (e.g. a status select)
}

export function Card({
  title,
  poster,
  badge,
  sub,
  progress,
  onClick,
  onRemove,
  removeLabel = "Rimuovi",
  busy,
  describedBy,
  children,
}: CardProps) {
  return (
    <div className="card">
      <button
        className="card-hit"
        onClick={onClick}
        title={title}
        aria-busy={busy || undefined}
        aria-describedby={describedBy}
        aria-keyshortcuts={onRemove ? "Delete" : undefined}
        onKeyDown={(e) => {
          // Canc removes the card (its × button is hard to reach with arrows)
          if (onRemove && e.key === "Delete") {
            e.preventDefault();
            onRemove();
          }
        }}
      >
        <span className="card-poster">
          <Poster src={poster} title={title} />
          {badge && (
            <span className="card-badge">
              <Tag tone={badge.tone}>{badge.label}</Tag>
            </span>
          )}
          {progress != null && progress > 0 && (
            <span className="card-meter" aria-hidden="true">
              <Meter value={progress} />
            </span>
          )}
        </span>
        <span className="card-title">{title}</span>
        {sub && <span className="card-sub">{sub}</span>}
      </button>
      {onRemove && (
        <button
          className="icon-btn card-remove"
          aria-label={`${removeLabel}: ${title}`}
          title={removeLabel}
          onClick={onRemove}
        >
          <X aria-hidden="true" className="ico" />
        </button>
      )}
      {children}
    </div>
  );
}

// placeholder grid while content loads
export function CardSkeletons({ count = 12 }: { count?: number }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="card skel-card" key={i}>
          <span className="card-poster skel" />
          <span className="skel skel-line" />
          <span className="skel skel-line short" />
        </div>
      ))}
    </div>
  );
}
