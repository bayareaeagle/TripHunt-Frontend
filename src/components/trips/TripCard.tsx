import Image from "next/image";
import Link from "next/link";
import { Calendar, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Trip } from "@/data/mock-trips";

const statusColors: Record<Trip["status"], string> = {
  active: "bg-sky-100 text-sky-700",
  funded: "bg-emerald-100 text-emerald-700",
  completed: "bg-slate-100 text-slate-700",
  rejected: "bg-rose-100 text-rose-700",
};

export function TripCard({ trip }: { trip: Trip }) {
  const fundingPercent = Math.round((trip.fundedAmount / trip.totalCost) * 100);

  return (
    <Link href={`/trips/${trip.id}`} className="group block">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={trip.imageUrl}
            alt={trip.destination}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute top-3 left-3">
            <Badge className={`${statusColors[trip.status]} border-0 font-medium`}>
              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-foreground">
            {trip.destination}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            by {trip.travelerName}
          </p>

          {/* Dates */}
          <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {new Date(trip.departureDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              -{" "}
              {new Date(trip.returnDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Funding Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                {fundingPercent}% funded
              </span>
              <span className="text-muted-foreground">
                {trip.fundedAmount.toLocaleString()} / {trip.totalCost.toLocaleString()} ADA
              </span>
            </div>
            <Progress value={fundingPercent} className="mt-2 h-2" />
          </div>

          {/* Votes */}
          <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>{trip.votesFor} votes</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
