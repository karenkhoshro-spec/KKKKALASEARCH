import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

interface Slide {
  image: string;
  altKey: string;
}

const SLIDES: Slide[] = [
  { image: "/images/slider-home-1.jpg", altKey: "home.sliderAlt1" },
  { image: "/images/slider-home-2.jpg", altKey: "home.sliderAlt2" },
  { image: "/images/slider-family.jpg", altKey: "home.sliderAlt3" },
];

const AUTOPLAY_MS = 4500;

export default function HeroSlider() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const goTo = useCallback((i: number) => {
    setIndex((i + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta > 0) prev();
      else next();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="animate-fade-up glass relative mx-auto w-full overflow-hidden rounded-3xl shadow-[var(--shadow-glow)]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-52 w-full sm:h-72 md:h-80 lg:h-96">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.image}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === index ? 1 : 0, zIndex: i === index ? 1 : 0 }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={slide.image}
                alt={t(slide.altKey)}
                className={`h-full w-full object-cover ${i === index ? "animate-kenburns" : ""}`}
              />
            </div>
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(0deg, rgba(10,6,20,0.55) 0%, rgba(10,6,20,0.05) 55%)" }}
            />
            <div className="absolute bottom-4 start-5 sm:bottom-6 sm:start-8">
              <span
                className="glass-strong inline-block rounded-full px-4 py-1.5 text-xs font-bold sm:text-sm"
                style={{ color: "#fff" }}
              >
                {t(slide.altKey)}
              </span>
            </div>
          </div>
        ))}

        {/* Left arrow = previous slide */}
        <button
          onClick={prev}
          aria-label="previous slide"
          className="glass-strong absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 sm:h-11 sm:w-11"
        >
          <ChevronLeft size={20} style={{ color: "var(--text-primary)" }} />
        </button>
        {/* Right arrow = next slide */}
        <button
          onClick={next}
          aria-label="next slide"
          className="glass-strong absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 sm:h-11 sm:w-11"
        >
          <ChevronRight size={20} style={{ color: "var(--text-primary)" }} />
        </button>

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`go to slide ${i + 1}`}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === index ? "22px" : "8px",
                background: i === index ? "var(--accent-1)" : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
