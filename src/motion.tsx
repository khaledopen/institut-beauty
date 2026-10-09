import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";

export type MotionPhoto = {
  src: string;
  title: string;
  category: string;
  alt: string;
};

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function PageMotion() {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const elements = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.reveal = "visible";
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.08 },
    );
    const register = () => {
      document
        .querySelectorAll<HTMLElement>(
          ".marketing main>section,.feature-grid article,.kpi,.panel,.studio-banner,.photo-section-app,.service-grid article",
        )
        .forEach((element, index) => {
          if (elements.has(element)) return;
          elements.add(element);
          element.dataset.reveal = "pending";
          element.style.setProperty(
            "--reveal-delay",
            `${Math.min((index % 4) * 75, 225)}ms`,
          );
          observer.observe(element);
        });
    };
    register();
    const updates = new MutationObserver(register);
    updates.observe(document.getElementById("root")!, {
      childList: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      updates.disconnect();
      for (const element of elements) {
        delete element.dataset.reveal;
        element.style.removeProperty("--reveal-delay");
      }
    };
  }, [pathname, reduced]);
  return null;
}

export function HeroSlideshow({ photos }: { photos: MotionPhoto[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (paused || interacting || reduced) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((index) => (index + 1) % photos.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, interacting, reduced, photos.length]);
  return (
    <div
      className="hero-slideshow"
      role="region"
      aria-roledescription="carrousel"
      aria-label="Les photos de l’univers Belleza"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setInteracting(false);
      }}
    >
      {photos.map((photo, index) => (
        <div
          className={`hero-slide ${index === active ? "is-active" : ""}`}
          key={photo.src}
          aria-hidden={index !== active}
        >
          <img
            src={photo.src}
            alt={photo.alt}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        </div>
      ))}
      <div className="image-caption slide-caption">
        <small>{photos[active].category}</small>
        <span>{photos[active].title}</span>
      </div>
      <div className="slideshow-controls">
        <button
          aria-label="Photo précédente"
          onClick={() =>
            setActive((active + photos.length - 1) % photos.length)
          }
        >
          <ArrowLeft size={18} />
        </button>
        <span className="slide-counter">
          {String(active + 1).padStart(2, "0")} /{" "}
          {String(photos.length).padStart(2, "0")}
        </span>
        <button
          aria-label="Photo suivante"
          onClick={() => setActive((active + 1) % photos.length)}
        >
          <ArrowRight size={18} />
        </button>
        <button
          aria-label={
            paused ? "Reprendre le diaporama" : "Mettre le diaporama en pause"
          }
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      </div>
      <div
        className="slide-progress"
        key={`${active}-${paused}-${interacting}-${reduced}`}
      >
        <i
          style={{
            animationPlayState:
              paused || interacting || reduced ? "paused" : "running",
          }}
        />
      </div>
    </div>
  );
}

export function PhotoMarquees({
  photos,
  paused,
  onSelect,
}: {
  photos: MotionPhoto[];
  paused: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="photo-marquees" data-paused={paused}>
      {[photos.slice(0, 5), photos.slice(5)].map((row, rowIndex) => (
        <div className="photo-marquee" key={rowIndex}>
          <div
            className={`photo-track ${rowIndex === 1 ? "photo-track-reverse" : ""}`}
          >
            {[false, true].map((duplicate) => (
              <div
                className={`photo-run ${duplicate ? "photo-run-duplicate" : ""}`}
                key={String(duplicate)}
                aria-hidden={duplicate || undefined}
              >
                {row.map((photo, index) => (
                  <button
                    key={photo.src}
                    className="photo-tile"
                    onClick={() => onSelect(rowIndex * 5 + index)}
                    tabIndex={duplicate ? -1 : 0}
                    aria-label={"Agrandir : " + photo.title}
                  >
                    <img
                      src={photo.src}
                      alt={duplicate ? "" : photo.alt}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="photo-caption">
                      <small>{photo.category}</small>
                      <strong>{photo.title}</strong>
                      <span className="photo-open">
                        <ArrowRight size={20} />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StudioPhotoStrip({ photos }: { photos: MotionPhoto[] }) {
  const [paused, setPaused] = useState(false);
  return (
    <div
      className="studio-banner-photos studio-animated"
      data-paused={paused}
      aria-label="Photos de l’univers beauté"
    >
      <div className="studio-photo-track">
        {[false, true].map((duplicate) => (
          <div
            className="studio-photo-run"
            aria-hidden={duplicate || undefined}
            key={String(duplicate)}
          >
            {photos.map((photo) => (
              <img
                key={photo.src}
                src={photo.src}
                alt={duplicate ? "" : photo.alt}
                loading="lazy"
              />
            ))}
          </div>
        ))}
      </div>
      <button
        className="studio-pause"
        aria-pressed={paused}
        aria-label={
          paused ? "Reprendre les photos" : "Mettre les photos en pause"
        }
        onClick={() => setPaused(!paused)}
      >
        {paused ? <Play size={17} /> : <Pause size={17} />}
      </button>
    </div>
  );
}
