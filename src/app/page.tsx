import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Wallet,
  MessageCircle,
  Sparkles,
  Users,
  Vote,
  Plane,
  ArrowRight,
  Globe,
  Shield,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { TripCarousel } from "@/components/trips/TripCarousel";
import { AccommodationCard } from "@/components/accommodations/AccommodationCard";
import { mockTrips, mockStats } from "@/data/mock-trips";

const pillars = [
  {
    icon: Globe,
    title: "Decentralized Travel DAO",
    description:
      "TripHunt is a community-owned travel club built on the Cardano blockchain. Members collectively decide who travels, where they go, and how funds are allocated — no middlemen, no gatekeepers.",
  },
  {
    icon: Shield,
    title: "Transparent & On-Chain",
    description:
      "Every proposal, vote, and disbursement is recorded on-chain through audited smart contracts. Treasury funds are managed by the community, ensuring full transparency and accountability.",
  },
  {
    icon: Heart,
    title: "Real Trips, Real People",
    description:
      "This isn't theoretical — TripHunt has already funded real vacations for real members. From beach resorts to mountain retreats, the community votes to send members on unforgettable trips.",
  },
];

const steps = [
  {
    icon: ShoppingBag,
    title: "Get Your NFT",
    description: "Purchase a TripHunt membership pass on JPG.store to join the club.",
  },
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your Cardano wallet (Nami, Eternl, or Flint) to the platform.",
  },
  {
    icon: MessageCircle,
    title: "Join Discord",
    description: "Connect your Discord to access the community and stay updated.",
  },
  {
    icon: Sparkles,
    title: "Start Exploring",
    description: "Submit travel requests, vote on proposals, and claim benefits.",
  },
];

const stats = [
  { label: "Trips Funded", value: mockStats.totalFundedTrips },
  { label: "Active Proposals", value: mockStats.activeProposals },
  { label: "Community Members", value: mockStats.communityMembers },
  { label: "ADA Disbursed", value: `${(mockStats.totalDisbursed / 1000).toFixed(0)}k` },
];

const activeTrips = mockTrips.filter((t) => t.status === "active" || t.status === "funded");

const accommodations = mockTrips.slice(0, 4).map((t) => ({
  name: t.accommodationName,
  destination: t.destination,
  imageUrl: t.accommodationImage,
  rating: t.accommodationRating,
}));

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-h-[600px] items-center gap-8 py-16 lg:grid-cols-2 lg:gap-12 lg:py-24">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700">
                <Plane className="h-4 w-4" />
                Community-Funded Travel
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Travel the World,{" "}
                <span className="text-primary">Funded by Community</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                TripHunt is a decentralized travel club that sends members on free or
                discounted vacations. Join the DAO, submit your dream trip, and let the
                community vote to fund your adventure.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/membership" className={buttonVariants({ size: "lg" })}>
                  Join the Club
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/trips" className={buttonVariants({ size: "lg", variant: "outline" })}>
                  Explore Trips
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&h=600&fit=crop"
                  alt="Beautiful tropical beach destination"
                  fill
                  className="object-cover"
                  priority
                  sizes="50vw"
                />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-6 -left-6 rounded-2xl border border-border/60 bg-white px-6 py-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Vote className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {mockStats.totalFundedTrips}
                    </p>
                    <p className="text-sm text-muted-foreground">Trips Funded</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/60 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is TripHunt */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="What is TripHunt?"
            subtitle="A decentralized travel club where NFT holders fund each other's dream vacations through community governance."
          />
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="rounded-2xl border border-border/60 bg-slate-50 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Trips Carousel */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Active Travel Requests"
            subtitle="Vote on community travel proposals and help send members around the world."
          />
          <div className="mt-14">
            <TripCarousel trips={activeTrips} />
          </div>
        </div>
      </section>

      {/* Featured Accommodations */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Featured Stays"
            subtitle="Discover the incredible accommodations our community members have experienced."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {accommodations.map((acc) => (
              <AccommodationCard key={acc.name} {...acc} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="How It Works"
            subtitle="Four simple steps to start your community-funded adventure."
          />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mt-1 text-xs font-medium text-primary">
                  Step {i + 1}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
            Ready to Travel?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Join the TripHunt community and submit your first travel request today.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/submit" className={buttonVariants({ size: "lg", variant: "secondary" })}>
              Submit a Request
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/membership"
              className={buttonVariants({ size: "lg", variant: "outline", className: "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" })}
            >
              <Users className="mr-2 h-4 w-4" />
              Become a Member
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
