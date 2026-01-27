"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface CarouselContextValue {
  index: number;
  count: number;
  setIndex: (val: number) => void;
  setCount: (val: number) => void;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

function useCarouselContext() {
  const ctx = useContext(CarouselContext);
  if (!ctx) {
    throw new Error("Carousel components must be used within <Carousel>");
  }
  return ctx;
}

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultIndex?: number;
}

export function Carousel({
  children,
  className,
  defaultIndex = 0,
  ...props
}: CarouselProps) {
  const [index, setIndex] = useState(defaultIndex);
  const [count, setCount] = useState(0);

  const value = useMemo(
    () => ({
      index,
      count,
      setCount,
      setIndex: (val: number) => {
        setIndex((prev) => {
          if (count === 0) return prev;
          const next = ((val % count) + count) % count;
          return next;
        });
      },
    }),
    [count, index],
  );

  return (
    <CarouselContext.Provider value={value}>
      <div
        className={cn("relative w-full overflow-hidden", className)}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

interface CarouselContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CarouselContent({
  children,
  className,
  ...props
}: CarouselContentProps) {
  const { index, setCount } = useCarouselContext();
  const slides = Array.isArray(children) ? children : [children];

  useEffect(() => {
    setCount(slides.length);
  }, [slides.length, setCount]);

  return (
    <div
      className={cn(
        "flex w-full transition-transform duration-300 ease-in-out",
        className,
      )}
      style={{ transform: `translateX(-${index * 100}%)` }}
      {...props}
    >
      {slides.map((child, i) => (
        <div key={i} className="min-w-full flex-shrink-0">
          {child}
        </div>
      ))}
    </div>
  );
}

interface CarouselItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CarouselItem({
  className,
  ...props
}: CarouselItemProps) {
  return <div className={cn("h-full w-full", className)} {...props} />;
}

interface ControlProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function CarouselPrevious({ className, ...props }: ControlProps) {
  const { index, count, setIndex } = useCarouselContext();
  const disabled = count <= 1;
  return (
    <button
      type="button"
      aria-label="Previous slide"
      disabled={disabled}
      onClick={() => setIndex(index - 1)}
      className={cn(
        "absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-sm shadow disabled:opacity-40",
        className,
      )}
      {...props}
    >
      ‹
    </button>
  );
}

export function CarouselNext({ className, ...props }: ControlProps) {
  const { index, count, setIndex } = useCarouselContext();
  const disabled = count <= 1;
  return (
    <button
      type="button"
      aria-label="Next slide"
      disabled={disabled}
      onClick={() => setIndex(index + 1)}
      className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-sm shadow disabled:opacity-40",
        className,
      )}
      {...props}
    >
      ›
    </button>
  );
}

export function useCarousel() {
  return useCarouselContext();
}
