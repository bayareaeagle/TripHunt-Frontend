import Image from "next/image";
import { Star, MapPin } from "lucide-react";

interface AccommodationCardProps {
  name: string;
  destination: string;
  imageUrl: string;
  rating: number;
}

export function AccommodationCard({
  name,
  destination,
  imageUrl,
  rating,
}: AccommodationCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl">
      {/* Image - tall card */}
      <div className="relative aspect-[3/4] sm:aspect-[4/5]">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="flex items-center gap-1 text-amber-400">
          <Star className="h-4 w-4 fill-current" />
          <span className="text-sm font-medium text-white">{rating}</span>
        </div>
        <h3 className="mt-1 text-xl font-semibold text-white">{name}</h3>
        <div className="mt-1 flex items-center gap-1 text-white/80">
          <MapPin className="h-3.5 w-3.5" />
          <span className="text-sm">{destination}</span>
        </div>
      </div>
    </div>
  );
}
