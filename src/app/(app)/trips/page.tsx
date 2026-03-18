"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { TripCard } from "@/components/trips/TripCard";
import { mockTrips } from "@/data/mock-trips";
import type { Trip } from "@/data/mock-trips";

const filters = [
  { key: "all", label: "All Trips" },
  { key: "active", label: "Active" },
  { key: "funded", label: "Funded" },
  { key: "completed", label: "Completed" },
] as const;

export default function TripsPage() {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredTrips =
    activeFilter === "all"
      ? mockTrips
      : mockTrips.filter((t: Trip) => t.status === activeFilter);

  return (
    <>
      {/* Header */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Explore Trips"
            subtitle="Browse community travel proposals. Vote to fund adventures or get inspired for your next submission."
          />
        </div>
      </section>

      {/* Trips Grid */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeFilter === filter.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>

          {filteredTrips.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">
                No trips found for this filter.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
