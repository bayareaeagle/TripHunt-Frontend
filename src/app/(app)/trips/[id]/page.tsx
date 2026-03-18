import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  MapPin,
  User,
  Briefcase,
  ArrowLeft,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Progress } from "@/components/ui/progress";
import { VotePanel } from "@/components/voting/VotePanel";
import { mockTrips } from "@/data/mock-trips";

const statusColors: Record<string, string> = {
  active: "bg-sky-100 text-sky-700",
  funded: "bg-emerald-100 text-emerald-700",
  completed: "bg-slate-100 text-slate-700",
  rejected: "bg-rose-100 text-rose-700",
};

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = mockTrips.find((t) => t.id === id);
  if (!trip) notFound();

  const fundingPercent = Math.round((trip.fundedAmount / trip.totalCost) * 100);

  return (
    <>
      {/* Back button */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link href="/trips" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Trips
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image */}
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
              <Image
                src={trip.imageUrl}
                alt={trip.destination}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
              <div className="absolute top-4 left-4">
                <Badge className={`${statusColors[trip.status]} border-0 text-sm`}>
                  {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Trip Info */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {trip.destination}
              </h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {trip.travelerName}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
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
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {trip.country}
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {trip.travelAgent}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                About This Trip
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {trip.description}
              </p>
            </div>

            {/* Accommodation */}
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Accommodation
              </h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
                <div className="relative aspect-[21/9]">
                  <Image
                    src={trip.accommodationImage}
                    alt={trip.accommodationName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      {trip.accommodationName}
                    </h3>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium">
                        {trip.accommodationRating}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {trip.destination}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Funding */}
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground">Funding</h3>
              <p className="mt-4 text-3xl font-bold text-foreground">
                {trip.fundedAmount.toLocaleString()}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  / {trip.totalCost.toLocaleString()} ADA
                </span>
              </p>
              <Progress value={fundingPercent} className="mt-3 h-3" />
              <p className="mt-2 text-sm text-muted-foreground">
                {fundingPercent}% funded
              </p>
            </div>

            {/* Vote Panel */}
            <VotePanel
              tripId={trip.id}
              votesFor={trip.votesFor}
              votesAgainst={trip.votesAgainst}
              status={trip.status}
            />

            {/* Timeline */}
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground">
                Proposal Timeline
              </h3>
              <div className="mt-4 space-y-4">
                {[
                  { label: "Proposed", active: true },
                  { label: "Voting", active: trip.status === "active" },
                  { label: "Tallying", active: false },
                  {
                    label: trip.status === "rejected" ? "Rejected" : "Funded",
                    active:
                      trip.status === "funded" || trip.status === "completed",
                  },
                ].map((stage, i) => (
                  <div key={stage.label} className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        stage.active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        stage.active ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
