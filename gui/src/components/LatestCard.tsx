import { useId, useRef, useState } from "react";
import { Card, Tag } from "./Card";
import type { AnimeInfo, LatestItem, Mode } from "../types";

// latest-episode card that reveals anime info (scores + synopsis) on hover or
// keyboard focus
export function LatestCard({
  item,
  mode,
  onClick,
}: {
  item: LatestItem;
  mode: Mode;
  onClick: () => void;
}) {
  const [info, setInfo] = useState<AnimeInfo | null>(null);
  const [show, setShow] = useState(false);
  const [align, setAlign] = useState<"center" | "left" | "right">("center");
  const timer = useRef<number | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);
  const popId = useId();

  function enter() {
    clearTimeout(timer.current);
    const el = ref.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const half = 150; // half of the popover width
      const center = r.left + r.width / 2;
      if (center - half < 8) setAlign("left");
      else if (center + half > window.innerWidth - 8) setAlign("right");
      else setAlign("center");
    }
    // a short delay keeps the popover from flashing while the pointer crosses the grid
    timer.current = window.setTimeout(() => {
      setShow(true);
      if (!info) window.ani.info(item.slug).then(setInfo).catch(() => {});
    }, 350);
  }

  function leave() {
    clearTimeout(timer.current);
    setShow(false);
  }

  return (
    <div
      className="hovercard"
      ref={ref}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      onKeyDown={(e) => {
        // Esc closes the info first; the next Esc goes back as usual
        if (e.key === "Escape" && show) {
          e.preventDefault();
          leave();
        }
      }}
    >
      <Card
        title={item.title}
        poster={item.poster}
        badge={{ label: `EP ${item.ep}`, tone: mode }}
        onClick={onClick}
        describedBy={show && info ? popId : undefined}
      />
      {show && (
        <div className={"hovercard-pop " + align} role="tooltip" id={popId}>
          {!info ? (
            <div className="hovercard-loading">
              <span className="skel skel-line" />
              <span className="skel skel-line short" />
            </div>
          ) : (
            <>
              <div className="hovercard-title">{info.title}</div>
              <div className="hovercard-tags">
                {info.anilistScore != null && <Tag>AniList {info.anilistScore}%</Tag>}
                {info.awScore != null && <Tag>AW {info.awScore.toFixed(2)}</Tag>}
                {info.episodes > 0 && <Tag>{info.episodes} ep</Tag>}
              </div>
              {info.genres.length > 0 && (
                <div className="hovercard-genres">{info.genres.join(" · ")}</div>
              )}
              <p className="hovercard-syn">
                {info.synopsis ? `${info.synopsis}…` : "Nessuna sinossi disponibile."}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
