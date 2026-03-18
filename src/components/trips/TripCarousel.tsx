"use client";

import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TripCard } from "./TripCard";
import type { Trip } from "@/data/mock-trips";

export function TripCarousel({ trips }: { trips: Trip[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <div className="absolute -top-14 right-0 flex gap-2">
        <button
          onClick={scrollPrev}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={scrollNext}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-4 flex">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="min-w-0 shrink-0 basis-full pl-4 sm:basis-1/2 lg:basis-1/3"
            >
              <TripCard trip={trip} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
