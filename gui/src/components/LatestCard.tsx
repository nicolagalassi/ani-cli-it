import { useRef, useState } from "react";
import { Card } from "./Card";
import type { AnimeInfo, LatestItem } from "../types";

// latest-episode card that reveals anime info (scores + synopsis) on hover
export function LatestCard({
  item,
  onClick,
}: {
  item: LatestItem;
  onClick: () => void;
}) {
  const [info, setInfo] = useState<AnimeInfo | null>(null);
  const [show, setShow] = useState(false);
  const [align, setAlign] = useState<"center" | "left" | "right">("center");
  const timer = useRef<number | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);

  function enter() {
    setShow(true);
    const el = ref.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const half = 130; // half of the 260px popover
      const center = r.left + r.width / 2;
      if (center - half < 8) setAlign("left");
      else if (center + half > window.innerWidth - 8) setAlign("right");
      else setAlign("center");
    }
    if (info) return;
    timer.current = window.setTimeout(() => {
      window.ani.info(item.slug).then((i) => setInfo(i));
    }, 300);
  }

  function leave() {
    setShow(false);
    clearTimeout(timer.current);
  }

  return (
    <div className="hovercard" ref={ref} onMouseEnter={enter} onMouseLeave={leave}>
      <Card
        title={item.title}
        poster={item.poster}
        badge={`Ep ${item.ep}`}
        onClick={onClick}
      />
      {show && (
        <div className={"hovercard-pop " + align} role="tooltip">
          {!info ? (
            <div className="hovercard-loading">Caricamento…</div>
          ) : (
            <>
              <div className="hovercard-title">{info.title}</div>
              <div className="hovercard-scores">
                {info.anilistScore != null && (
                  <span className="pill score">★ {info.anilistScore}%</span>
                )}
                {info.awScore != null && (
                  <span className="pill score aw">
                    AW ★ {info.awScore.toFixed(2)}
                  </span>
                )}
                {info.episodes > 0 && (
                  <span className="pill">{info.episodes} ep</span>
                )}
              </div>
              {info.genres.length > 0 && (
                <div className="hovercard-genres">{info.genres.join(" · ")}</div>
              )}
              {info.synopsis ? (
                <p className="hovercard-syn">{info.synopsis}…</p>
              ) : (
                <p className="hovercard-syn dim">Nessuna sinossi disponibile.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
