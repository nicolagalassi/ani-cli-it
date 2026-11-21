import { Info, Play, X } from "lucide-react";
import { Meter, Poster } from "./Card";

interface ContinueCardProps {
  title: string;
  poster: string | null;
  line: string; // e.g. "Ep 5 · 18:40 / 23:40"
  progress?: number | null; // 0..1 of the last episode
  busy?: boolean;
  lit?: boolean; // new episodes out: stays yellow until watched
  onPlay: () => void;
  onInfo: () => void;
  onRemove: () => void;
}

// compact card for "Continua a guardare": the card plays, the side buttons
// open the series page or drop it from the history
export function ContinueCard({ title, poster, line, progress, busy, lit, onPlay, onInfo, onRemove }: ContinueCardProps) {
  return (
    <div className={"ccard" + (lit ? " is-lit" : "")}>
      <button
        className="ccard-hit"
        onClick={onPlay}
        title={title}
        aria-busy={busy || undefined}
        aria-keyshortcuts="Delete"
        onKeyDown={(e) => {
          if (e.key === "Delete") {
            e.preventDefault();
            onRemove();
          }
        }}
      >
        <span className="ccard-poster">
          <Poster src={poster} title={title} />
          <span className="ccard-play" aria-hidden="true">
            <Play className="ico" />
          </span>
        </span>
        <span className="ccard-body">
          <span className="ccard-title">{title}</span>
          <span className="ccard-line">{busy ? "Apertura…" : line}</span>
          {progress != null && (
            <span aria-hidden="true">
              <Meter value={progress} />
            </span>
          )}
        </span>
      </button>
      <span className="ccard-actions">
        <button className="icon-btn" aria-label={`Scheda: ${title}`} title="Scheda della serie" onClick={onInfo}>
          <Info aria-hidden="true" className="ico" />
        </button>
        <button className="icon-btn" aria-label={`Togli dalla cronologia: ${title}`} title="Togli dalla cronologia" onClick={onRemove}>
          <X aria-hidden="true" className="ico" />
        </button>
      </span>
    </div>
  );
}
